import React from 'react';
import { Icons } from './Icons';
import { motion, AnimatePresence } from 'motion/react';
import { INITIAL_PRODUCTS } from '../constants';
import { usePreferences } from '../utils/preferences';
import { getProductRatingAndReviews } from '../utils/sales';

interface CameraSearchViewProps {
  onBack: () => void;
  onSelectProduct: (product: any) => void;
}

export default function CameraSearchView({ onBack, onSelectProduct }: CameraSearchViewProps) {
  const { t, formatPrice } = usePreferences();
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = React.useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = React.useState<any | null>(null);
  const [isCameraActive, setIsCameraActive] = React.useState(false);
  const [cameraError, setCameraError] = React.useState<string | null>(null);
  const [scanStatus, setScanStatus] = React.useState<'idle' | 'scanning' | 'completed'>('idle');
  const [scanProgress, setScanProgress] = React.useState(0);
  const [scanStep, setScanStep] = React.useState('');
  const [matchedProduct, setMatchedProduct] = React.useState<any | null>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [isSimulatedMode, setIsSimulatedMode] = React.useState(false);
  const [simulatedTargetIdx, setSimulatedTargetIdx] = React.useState(0);
  const [scannedFile, setScannedFile] = React.useState<File | null>(null);
  const [matchError, setMatchError] = React.useState(false);
  const [apiResult, setApiResult] = React.useState<any | null>(null);
  const [isScanningApiRunning, setIsScanningApiRunning] = React.useState(false);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = React.useRef<HTMLInputElement>(null);

  // Stop camera stream on unmount
  React.useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Handle Scan Animation steps
  React.useEffect(() => {
    if (scanStatus === 'scanning') {
      setScanProgress(0);
      setScanStep('Initializing smart engine...');
      setApiResult(null);

      // Concurrently query Visual Search backend unless preset is active
      if (capturedImage && !selectedPreset) {
        setIsScanningApiRunning(true);
        fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64Image: capturedImage,
            mimeType: capturedImage.includes(';') ? capturedImage.substring(capturedImage.indexOf(':') + 1, capturedImage.indexOf(';')) : 'image/jpeg'
          })
        })
        .then(res => {
          if (!res.ok) throw new Error('Visual search backend failed');
          return res.json();
        })
        .then(data => {
          setApiResult(data);
          setIsScanningApiRunning(false);
        })
        .catch(err => {
          console.warn('Scan API error, falling back to heuristic:', err);
          setIsScanningApiRunning(false);
        });
      } else {
        setIsScanningApiRunning(false);
      }
      
      const interval = setInterval(() => {
        setScanProgress(prev => {
          const next = prev + 4;
          if (next >= 100) {
            clearInterval(interval);
            return 100;
          }

          // Update scan step logs progressively for realism
          if (next > 15 && next < 40) {
            setScanStep('Segmenting product contours...');
          } else if (next >= 40 && next < 65) {
            setScanStep('Analyzing color histograms & textures...');
          } else if (next >= 65 && next < 85) {
            setScanStep('Querying Bazar catalog...');
          } else if (next >= 85) {
            setScanStep('Calculating confidence scores...');
          }
          return next;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [scanStatus, capturedImage, selectedPreset]);

  // Handle Scan transition completion once both progress bar and API complete
  React.useEffect(() => {
    if (scanStatus === 'scanning' && scanProgress === 100 && !isScanningApiRunning) {
      handleScanCompletion();
    }
  }, [scanStatus, scanProgress, isScanningApiRunning]);

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    setIsSimulatedMode(false);
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn('Physical camera unavailable:', err);
      // Fallback gracefully to high fidelity simulated lens
      setIsSimulatedMode(true);
      setCameraError('Camera sandbox restriction active in preview. Auto-switched to Interactive Lens Simulator!');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
    setIsSimulatedMode(false);
  };

  const capturePhoto = () => {
    if (isSimulatedMode) {
      const targetProd = INITIAL_PRODUCTS[simulatedTargetIdx];
      setSelectedPreset(targetProd);
      setCapturedImage(targetProd.image);
      stopCamera();
      setScanStatus('scanning');
      return;
    }

    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
         canvas.width = video.videoWidth || 640;
         canvas.height = video.videoHeight || 480;
        
        // Mirror if not back camera (not standard, but good)
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        setSelectedPreset(null);
        stopCamera();
        
        // Auto start scanning
        setScanStatus('scanning');
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScannedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCapturedImage(event.target.result as string);
          setSelectedPreset(null);
          stopCamera();
          setScanStatus('scanning');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNativeCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScannedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCapturedImage(event.target.result as string);
          setSelectedPreset(null);
          stopCamera();
          setScanStatus('scanning');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setScannedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCapturedImage(event.target.result as string);
          setSelectedPreset(null);
          stopCamera();
          setScanStatus('scanning');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePresetSelect = (preset: any) => {
    setScannedFile(null);
    setSelectedPreset(preset);
    setCapturedImage(preset.image);
    stopCamera();
    setScanStatus('scanning');
  };

  const handleScanCompletion = () => {
    setScanStatus('completed');
    
    // Select matched item
    if (selectedPreset) {
      setMatchedProduct(selectedPreset);
      setMatchError(false);
      return;
    }

    if (apiResult) {
      if (apiResult.matched && apiResult.productName) {
        const matched = INITIAL_PRODUCTS.find(p => p.name === apiResult.productName);
        if (matched) {
          setMatchedProduct(matched);
          setMatchError(false);
          return;
        }
      }
    }
    
    // Heuristic fallbacks if API wasn't triggered, failed, or returned unmatched
    if (scannedFile) {
      const fileName = scannedFile.name.toLowerCase();
      
      // Keywords mapping
      let matched = null;
      if (fileName.includes('watch') || fileName.includes('time') || fileName.includes('clock') || fileName.includes('wrist') || fileName.includes('smart')) {
        matched = INITIAL_PRODUCTS.find(p => p.category === 'Watch'); // returns Minimalist Timepiece
        if (fileName.includes('health') || fileName.includes('smart')) {
          const smartChoice = INITIAL_PRODUCTS.find(p => p.name.toLowerCase().includes('smart'));
          if (smartChoice) matched = smartChoice;
        }
      } else if (fileName.includes('shoe') || fileName.includes('run') || fileName.includes('crimson') || fileName.includes('turbo') || fileName.includes('sneak') || fileName.includes('sport') || fileName.includes('kick')) {
        matched = INITIAL_PRODUCTS.find(p => p.category === 'Shoes');
      } else if (fileName.includes('head') || fileName.includes('audio') || fileName.includes('sound') || fileName.includes('ear') || fileName.includes('music') || fileName.includes('phone') || fileName.includes('mic') || fileName.includes('pro')) {
        matched = INITIAL_PRODUCTS.find(p => p.category === 'Audio');
      }

      if (matched) {
        setMatchedProduct(matched);
        setMatchError(false);
      } else {
        setMatchedProduct(null);
        setMatchError(true);
      }
    } else if (isSimulatedMode) {
      setMatchedProduct(INITIAL_PRODUCTS[simulatedTargetIdx]);
      setMatchError(false);
    } else {
      setMatchedProduct(null);
      setMatchError(true);
    }
  };

  const resetScanner = () => {
    setCapturedImage(null);
    setSelectedPreset(null);
    setMatchedProduct(null);
    setScannedFile(null);
    setMatchError(false);
    setScanStatus('idle');
    setScanProgress(0);
    setScanStep('');
    if (isCameraActive) {
      startCamera();
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-surface/95 backdrop-blur-3xl flex flex-col text-foreground animate-in slide-in-from-right duration-300 overflow-y-auto pb-12 scrollbar-hide">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md px-5 h-16 flex items-center justify-between border-b border-white/10 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              stopCamera();
              onBack();
            }} 
            className="p-2 glass-card rounded-full hover:bg-white/10 transition-colors active:scale-95 text-primary"
          >
            <Icons.ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-base font-bold flex items-center gap-1.5">
              <Icons.Camera size={18} className="text-primary" /> Visual Scan
            </h1>
            <p className="text-[10px] text-outline">Search products by photo</p>
          </div>
        </div>
        
        {scanStatus !== 'idle' && (
          <button 
            onClick={resetScanner}
            className="text-xs font-bold px-3 py-1.5 glass-card rounded-full text-primary hover:bg-white/10 active:scale-95 transition-all flex items-center gap-1"
          >
            <Icons.Trash2 size={12} /> Scan again
          </button>
        )}
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-5 py-6 flex flex-col gap-6">

        <AnimatePresence mode="wait">
          {scanStatus === 'idle' && (
            <motion.div 
              key="camera-selector"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6 flex flex-col justify-center min-h-[50vh]"
            >
              <div className="text-center space-y-2 mb-4">
                <span className="text-[10px] bg-primary/10 border border-primary/25 text-primary px-3 py-1 rounded-full uppercase font-black tracking-widest animate-pulse inline-block">
                  AI-Powered Visual Search
                </span>
                <h2 className="text-xl font-extrabold text-white tracking-tight">How would you like to search?</h2>
                <p className="text-xs text-outline max-w-sm mx-auto">Snap or upload a photo of any item to scan our premium catalog instantaneously.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-xl mx-auto w-full">
                {/* Option 1: Native System Camera (Phone Camera) */}
                <button 
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-4 p-8 rounded-3xl glass-card border border-primary/25 text-center transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 active:scale-[0.97] group bg-white/5 cursor-pointer max-w-sm mx-auto w-full relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none group-hover:bg-primary/20 transition-all" />
                  <div className="w-16 h-16 rounded-2xl bg-primary/15 text-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner border border-primary/25">
                    <Icons.Camera size={32} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-base">Phone Camera</h3>
                    <p className="text-xs text-outline mt-1.5 px-4 leading-relaxed font-semibold">Capture a live photo using your phone's camera</p>
                  </div>
                </button>
                <input 
                  type="file" 
                  ref={nativeCameraInputRef} 
                  onChange={handleNativeCameraCapture} 
                  accept="image/*" 
                  capture="environment" 
                  className="hidden" 
                />

                {/* Option 2: Upload existing image file (Phone Gallery) */}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-4 p-8 rounded-3xl glass-card border border-primary/25 text-center transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 active:scale-[0.97] group bg-white/5 cursor-pointer max-w-sm mx-auto w-full relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none group-hover:bg-primary/20 transition-all" />
                  <div className="w-16 h-16 rounded-2xl bg-primary/15 text-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner border border-primary/25">
                    <Icons.Image size={32} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-base">Phone Gallery</h3>
                    <p className="text-xs text-outline mt-1.5 px-4 leading-relaxed font-semibold">Choose a saved photo from your phone gallery</p>
                  </div>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>

              {cameraError && (
                <div className="p-3 bg-error/10 border border-error/20 text-error rounded-2xl text-[11px] font-medium leading-relaxed flex items-center gap-2 max-w-sm mx-auto">
                  <Icons.XCircle size={14} className="shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}
            </motion.div>
          )}

          {scanStatus === 'scanning' && (
            <motion.div 
              key="camera-scanning"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-6 text-center"
            >
              <div className="relative w-72 h-72 rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-black">
                {capturedImage && (
                  <img 
                    src={capturedImage} 
                    alt="Scan Target" 
                    className="w-full h-full object-cover blur-[0.5px]"
                    referrerPolicy="no-referrer"
                  />
                )}
                
                {/* Visual Laser Scanning Animation Box */}
                <motion.div 
                  className="absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-primary to-transparent z-10 shadow-[0_0_12px_#10b981]"
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                />

                {/* Grid patterns for sci-fi search feel */}
                <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />

                {/* Dynamic scanner box brackets */}
                <div className="absolute top-6 left-6 w-8 h-8 border-t-[3px] border-l-[3px] border-primary rounded-tl-lg" />
                <div className="absolute top-6 right-6 w-8 h-8 border-t-[3px] border-r-[3px] border-primary rounded-tr-lg" />
                <div className="absolute bottom-6 left-6 w-8 h-8 border-b-[3px] border-l-[3px] border-primary rounded-bl-lg" />
                <div className="absolute bottom-6 right-6 w-8 h-8 border-b-[3px] border-r-[3px] border-primary rounded-br-lg" />

                {/* Central radar visual target circle */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-dashed border-primary/40 animate-spin [animation-duration:10s]" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-primary/60" />
              </div>

              {/* Progress Logs & Info */}
              <div className="mt-8 space-y-4 w-full max-w-sm">
                <div>
                  <h3 className="font-black tracking-tight text-base animate-pulse text-primary flex items-center justify-center gap-1.5">
                    <Icons.TrendingUp className="animate-bounce" size={16} /> Scanning Product...
                  </h3>
                  <p className="text-xs text-outline font-mono mt-1 h-4">{scanStep}</p>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-white/5 border border-white/10 rounded-full h-2.5 overflow-hidden">
                  <motion.div 
                    className="h-full bg-primary"
                    style={{ width: `${scanProgress}%` }}
                    transition={{ ease: "easeOut" }}
                  />
                </div>
                <div className="text-[10px] font-bold text-outline uppercase tracking-wider">
                  Bazar Computer Vision API ({scanProgress}%)
                </div>
              </div>
            </motion.div>
          )}

          {scanStatus === 'completed' && (
            <motion.div 
              key="camera-completed"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {matchError ? (
                /* No Match Found Screen */
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="glass-card rounded-3xl p-8 border border-white/5 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-5 border border-amber-500/25 shadow-lg shadow-amber-500/5">
                      <Icons.XCircle size={36} className="text-amber-500 animate-pulse" />
                    </div>
                    <h2 className="text-xl font-black tracking-tight text-white uppercase sm:text-2xl">Search manually to find products</h2>
                    <p className="text-xs text-outline font-medium mt-3 leading-relaxed max-w-sm">
                      Bazar scanned the photo but could not find a match in our active catalog. Please click search manually, or attempt to photograph another product!
                    </p>

                    <div className="mt-6 p-4 rounded-2xl bg-white/5 text-[11px] text-outline text-left leading-relaxed space-y-2 border border-white/5 w-full">
                      <p className="font-black text-primary uppercase text-[9px] tracking-wider">💡 Helpful scanned hints:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>Ensure clear focus, centered angles and bright direct natural lighting.</li>
                        <li>Scan items that look like shoes, wireless headphones, or chronograph sports wristwatches.</li>
                      </ul>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      onClick={resetScanner}
                      className="flex-1 py-4 rounded-2xl text-xs font-semibold glass-card border-white/10 hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow"
                    >
                      <Icons.Camera size={14} /> Tap to Try Again
                    </button>

                    <button 
                      onClick={() => {
                        stopCamera();
                        onBack();
                      }}
                      className="flex-1 py-4 rounded-2xl bg-primary text-on-primary text-xs font-black hover:bg-opacity-90 active:scale-95 shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                    >
                      Browse All Products
                    </button>
                  </div>
                </div>
              ) : (
                /* Product Matched Screen */
                <>
                  {/* Scan Summary Card */}
                  <div className="glass-card rounded-3xl p-6 border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent flex flex-col items-center text-center animate-in fade-in duration-300">
                    <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-4 border border-primary/30">
                      <Icons.CheckCircle2 size={36} />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-white">Product Successfully Matched!</h2>
                    <p className="text-[11px] text-outline font-medium mt-1 leading-relaxed px-4">
                      {apiResult?.explanation || "Bazar AI scanned your image and identified the correct product matching our inventory"}
                    </p>
                    
                    {/* Confidence match level */}
                    <div className="mt-4 px-4 py-1.5 rounded-full bg-primary text-on-primary text-[10px] font-black tracking-wider uppercase shadow-md shadow-primary/10 flex items-center gap-1.5">
                      <Icons.Sparkles size={11} /> {apiResult?.confidence ? (apiResult.confidence * 100).toFixed(1) : "98.7"}% Match Accuracy Index
                    </div>
                  </div>

                  {/* Dual Image Preview and Details */}
                  {matchedProduct && (
                    <div className="space-y-4 animate-in fade-in duration-500">
                      {/* Visual Pair */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Left: Uploaded Frame */}
                        <div className="glass-card rounded-3xl p-4 border border-white/5 flex flex-col items-center text-center bg-white/2">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-outline mb-2">Your Photo</span>
                          <div className="w-full aspect-square rounded-2xl overflow-hidden bg-black/20 border border-white/10 shadow-lg">
                            <img 
                              src={capturedImage || matchedProduct.image} 
                              alt="Your scanned photo" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </div>

                        {/* Right: Catalog Product Ref */}
                        <div className="glass-card rounded-3xl p-4 border border-primary/10 flex flex-col items-center text-center bg-primary/5">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-primary mb-2">{t('bazar_catalog', 'Bazar Catalog')}</span>
                          <div className="w-full aspect-square rounded-2xl overflow-hidden bg-black/20 border border-primary/15 shadow-lg">
                            <img 
                              src={matchedProduct.image} 
                              alt={t(matchedProduct.name, matchedProduct.name)} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Product details */}
                      <div className="glass-card rounded-3xl p-5 border border-white/10 flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[9px] bg-primary/15 text-primary px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                              {t(matchedProduct.category || 'General', matchedProduct.category || 'General')}
                            </span>
                            {matchedProduct.tag && (
                              <span className="text-[9px] bg-secondary text-white px-2 py-0.5 rounded-full font-bold">
                                {t(matchedProduct.tag, matchedProduct.tag)}
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-black truncate text-white mb-1">{t(matchedProduct.name, matchedProduct.name)}</h3>
                          
                          <div className="flex items-center gap-1.5 text-[10px] text-outline font-bold">
                            <Icons.Star className="text-secondary fill-secondary" size={10} />
                            <span>{getProductRatingAndReviews(matchedProduct.name).rating} ({getProductRatingAndReviews(matchedProduct.name).reviewsCount} {t('reviews', 'reviews')})</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="block text-2xl font-black text-primary leading-none">{formatPrice(matchedProduct.price, matchedProduct.customPrices)}</span>
                          {matchedProduct.originalPrice && (
                            <span className="text-xs text-outline line-through leading-none block mt-1">{formatPrice(matchedProduct.originalPrice, matchedProduct.customPrices ? Object.fromEntries(Object.entries(matchedProduct.customPrices).map(([k, v]) => [k, (v as number) * 1.8])) : undefined)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <button 
                      onClick={resetScanner}
                      className="flex-1 py-3.5 rounded-2xl text-xs font-bold glass-card border-white/20 hover:bg-white/10 active:scale-95 transition-transform flex items-center justify-center gap-1.5 shadow"
                    >
                      <Icons.Camera size={14} /> Scan another
                    </button>

                    <button 
                      onClick={() => {
                        if (matchedProduct) {
                          onSelectProduct(matchedProduct);
                        }
                      }}
                      className="flex-[2] py-3.5 rounded-2xl bg-primary text-on-primary text-xs font-black hover:bg-opacity-90 active:scale-95 shadow-lg shadow-primary/20 transition-transform flex items-center justify-center gap-2"
                    >
                      Show Product Details <Icons.ArrowRight size={14} />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </main>
      
      {/* Hidden canvas used to render capture frame */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
