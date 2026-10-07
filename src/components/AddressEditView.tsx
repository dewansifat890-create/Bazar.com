import React from 'react';
import { Icons } from './Icons';
import { motion } from 'motion/react';
import { BANGLADESH_LOCATIONS } from '../data/locations';

interface AddressEditViewProps {
  onBack: () => void;
  onSave: (address: any) => void;
  initialData?: any;
}

export default function AddressEditView({ onBack, onSave, initialData }: AddressEditViewProps) {
  const [formData, setFormData] = React.useState({
    fullName: initialData?.fullName || '',
    mobile: initialData?.mobile || '',
    department: initialData?.department || '',
    district: initialData?.district || '',
    upazila: initialData?.upazila || '',
    union: initialData?.union || '',
    area: initialData?.area || '',
    deliveryArea: initialData?.deliveryArea || 'Home', // Product delivery area
    address: initialData?.address || '',
    label: initialData?.label || 'Home',
    isDefault: initialData?.isDefault ?? true
  });

  const [isManual, setIsManual] = React.useState({
    district: false,
    upazila: false,
    union: false
  });

  // Get dynamic options based on current selection
  const districts = React.useMemo(() => {
    if (!formData.department) return [];
    return Object.keys(BANGLADESH_LOCATIONS[formData.department] || {});
  }, [formData.department]);

  const upazilas = React.useMemo(() => {
    if (!formData.department || !formData.district) return [];
    return Object.keys(BANGLADESH_LOCATIONS[formData.department]?.[formData.district] || {});
  }, [formData.department, formData.district]);

  const unions = React.useMemo(() => {
    if (!formData.department || !formData.district || !formData.upazila) return [];
    return BANGLADESH_LOCATIONS[formData.department]?.[formData.district]?.[formData.upazila] || [];
  }, [formData.department, formData.district, formData.upazila]);

  // Handlers for resetting children
  const handleDepartmentChange = (val: string) => {
    setFormData({
      ...formData,
      department: val,
      district: '',
      upazila: '',
      union: ''
    });
  };

  const handleDistrictChange = (val: string) => {
    setFormData({
      ...formData,
      district: val,
      upazila: '',
      union: ''
    });
  };

  const handleUpazilaChange = (val: string) => {
    setFormData({
      ...formData,
      upazila: val,
      union: ''
    });
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-50 text-slate-900 flex flex-col animate-in fade-in slide-in-from-bottom duration-300 overflow-y-auto pb-32 select-none">
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 right-0 w-full max-w-xl mx-auto z-50 bg-white/80 backdrop-blur-2xl border-b border-slate-200/80 shadow-xs flex items-center justify-between px-4 sm:px-5 h-16">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/90 border border-slate-200/80 hover:bg-slate-100 flex items-center justify-center text-slate-800 shadow-xs active:scale-90 cursor-pointer transition-all shrink-0"
          >
            <Icons.ArrowLeft size={20} className="text-emerald-600" />
          </button>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              📍 Shipping Address
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Auto-saved for express 1-click checkout
            </p>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <main className="pt-20 px-3.5 sm:px-5 max-w-xl mx-auto space-y-5 w-full">
        {/* Contact Details Section Card */}
        <section className="bg-white/80 border border-white/90 rounded-[28px] p-4 sm:p-5 shadow-[0_10px_40px_rgba(0,0,0,0.06),inset_0_1.5px_3px_rgba(255,255,255,1)] backdrop-blur-2xl space-y-4">
          <h2 className="text-[10.5px] font-black text-emerald-800 uppercase tracking-widest border-b border-slate-100 pb-2.5 flex items-center gap-1.5">
            <Icons.User size={14} className="text-emerald-600" />
            Contact Details
          </h2>
          <div className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[10.5px] font-black text-slate-700 uppercase tracking-wider ml-1">Recipient's Name</label>
              <input 
                className="w-full bg-slate-50/90 border border-slate-200/90 rounded-2xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-bold shadow-2xs placeholder:text-slate-400" 
                placeholder="Name" 
                type="text" 
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10.5px] font-black text-slate-700 uppercase tracking-wider ml-1">BD Phone Number</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-600">+880</span>
                <input 
                  className="w-full bg-slate-50/90 border border-slate-200/90 rounded-2xl pl-14 pr-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-bold shadow-2xs placeholder:text-slate-400" 
                  placeholder="Number" 
                  type="tel" 
                  value={formData.mobile}
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Location Selection Card */}
        <section className="bg-white/80 border border-white/90 rounded-[28px] p-4 sm:p-5 shadow-[0_10px_40px_rgba(0,0,0,0.06),inset_0_1.5px_3px_rgba(255,255,255,1)] backdrop-blur-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h2 className="text-[10.5px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-1.5">
              <Icons.MapPin size={14} className="text-emerald-600" />
              Delivery Location Details
            </h2>
            <span className="text-[10px] font-bold text-slate-500">বাংলাদেশ কুরিয়ার</span>
          </div>

          {/* Dynamic Delivery Charge Preview */}
          {(() => {
            const dist = (formData.district || '').toLowerCase().trim();
            const dept = (formData.department || '').toLowerCase().trim();
            const DHAKA_DIV_DISTRICTS = ['gazipur', 'narayanganj', 'narsingdi', 'tangail', 'kishoreganj', 'faridpur', 'manikganj', 'munshiganj', 'gopalganj', 'madaripur', 'rajbari', 'shariatpur'];
            const isDhakaCity = dist === 'dhaka' || (dept === 'dhaka' && (!dist || dist === 'dhaka'));
            const isDhakaDivision = !isDhakaCity && (dept === 'dhaka' || DHAKA_DIV_DISTRICTS.includes(dist));
            
            let chargeLabel = 'ডেলিভারি চার্জ: ঢাকা সিটিতে ৳৬০, ঢাকা বিভাগে ৳৭০, ঢাকার বাইরে ৳১২০';
            let chargeBadge = 'অটো হিসাব';
            
            if (formData.district || formData.department) {
              if (isDhakaCity) {
                chargeLabel = 'ঢাকা সিটির ভেতরে ডেলিভারি চার্জ:';
                chargeBadge = '৳৬০';
              } else if (isDhakaDivision) {
                chargeLabel = `ঢাকা বিভাগের মধ্যে (${formData.district || 'বিভাগ'}) ডেলিভারি চার্জ:`;
                chargeBadge = '৳৭০';
              } else {
                chargeLabel = `ঢাকার বাইরে সারাদেশে (${formData.district || formData.department}) ডেলিভারি চার্জ:`;
                chargeBadge = '৳১২০';
              }
            }

            return (
              <div className="p-3 bg-emerald-50/90 rounded-2xl border border-emerald-200/80 flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="text-base">🚚</span>
                  <span className="text-[11px] font-bold text-slate-700">
                    {chargeLabel}
                  </span>
                </div>
                <span className="text-xs font-mono font-black text-emerald-700 bg-white px-2.5 py-1 rounded-full border border-emerald-200 shrink-0 shadow-2xs">
                  {chargeBadge}
                </span>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-[10.5px] font-black text-slate-700 uppercase tracking-wider ml-1">Department</label>
              <div className="relative">
                <select 
                  className="w-full appearance-none bg-slate-50/90 border border-slate-200/90 rounded-2xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-bold shadow-2xs pr-10 cursor-pointer"
                  value={formData.department}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                >
                  <option value="" disabled>Select Department</option>
                  {Object.keys(BANGLADESH_LOCATIONS).map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                <Icons.ExpandMore size={18} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
              </div>
            </div>

            {/* District/City */}
            <div className="space-y-1">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10.5px] font-black text-slate-700 uppercase tracking-wider">District/City</label>
                <button 
                  type="button"
                  onClick={() => setIsManual({...isManual, district: !isManual.district})}
                  className={`p-1 rounded-lg transition-colors ${isManual.district ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 hover:bg-slate-100'}`}
                  title="Toggle manual input"
                >
                  <Icons.Edit size={13} />
                </button>
              </div>
              <div className="relative">
                {isManual.district ? (
                  <input 
                    className="w-full bg-slate-50/90 border border-slate-200/90 rounded-2xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-bold shadow-2xs placeholder:text-slate-400" 
                    placeholder="Enter District" 
                    type="text" 
                    value={formData.district}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                  />
                ) : (
                  <>
                    <select 
                      className="w-full appearance-none bg-slate-50/90 border border-slate-200/90 rounded-2xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-bold shadow-2xs disabled:opacity-50 pr-10 cursor-pointer"
                      value={formData.district}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      disabled={!formData.department}
                    >
                      <option value="" disabled>{formData.department ? 'Select District' : 'Select Department First'}</option>
                      {districts.map(dist => (
                        <option key={dist} value={dist}>{dist}</option>
                      ))}
                    </select>
                    <Icons.ExpandMore size={18} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
                  </>
                )}
              </div>
            </div>

            {/* Upazila */}
            <div className="space-y-1">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10.5px] font-black text-slate-700 uppercase tracking-wider">Upazila</label>
                <button 
                  type="button"
                  onClick={() => setIsManual({...isManual, upazila: !isManual.upazila})}
                  className={`p-1 rounded-lg transition-colors ${isManual.upazila ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 hover:bg-slate-100'}`}
                  title="Toggle manual input"
                >
                  <Icons.Edit size={13} />
                </button>
              </div>
              <div className="relative">
                {isManual.upazila ? (
                  <input 
                    className="w-full bg-slate-50/90 border border-slate-200/90 rounded-2xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-bold shadow-2xs placeholder:text-slate-400" 
                    placeholder="Enter Upazila" 
                    type="text" 
                    value={formData.upazila}
                    onChange={(e) => handleUpazilaChange(e.target.value)}
                  />
                ) : (
                  <>
                    <select 
                      className="w-full appearance-none bg-slate-50/90 border border-slate-200/90 rounded-2xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-bold shadow-2xs disabled:opacity-50 pr-10 cursor-pointer"
                      value={formData.upazila}
                      onChange={(e) => handleUpazilaChange(e.target.value)}
                      disabled={!formData.district}
                    >
                      <option value="" disabled>{formData.district ? 'Select Upazila' : 'Select District First'}</option>
                      {upazilas.map(upz => (
                        <option key={upz} value={upz}>{upz}</option>
                      ))}
                    </select>
                    <Icons.ExpandMore size={18} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
                  </>
                )}
              </div>
            </div>

            {/* Pourashava/Union */}
            <div className="space-y-1">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10.5px] font-black text-slate-700 uppercase tracking-wider">Union / Ward</label>
                <button 
                  type="button"
                  onClick={() => setIsManual({...isManual, union: !isManual.union})}
                  className={`p-1 rounded-lg transition-colors ${isManual.union ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 hover:bg-slate-100'}`}
                  title="Toggle manual input"
                >
                  <Icons.Edit size={13} />
                </button>
              </div>
              <div className="relative">
                {isManual.union ? (
                  <input 
                    className="w-full bg-slate-50/90 border border-slate-200/90 rounded-2xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-bold shadow-2xs placeholder:text-slate-400" 
                    placeholder="Enter Union" 
                    type="text" 
                    value={formData.union}
                    onChange={(e) => setFormData({...formData, union: e.target.value})}
                  />
                ) : (
                  <>
                    <select 
                      className="w-full appearance-none bg-slate-50/90 border border-slate-200/90 rounded-2xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-bold shadow-2xs disabled:opacity-50 pr-10 cursor-pointer"
                      value={formData.union}
                      onChange={(e) => setFormData({...formData, union: e.target.value})}
                      disabled={!formData.upazila}
                    >
                      <option value="" disabled>{formData.upazila ? 'Select Union' : 'Select Upazila First'}</option>
                      {unions.map(un => (
                        <option key={un} value={un}>{un}</option>
                      ))}
                    </select>
                    <Icons.ExpandMore size={18} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
                  </>
                )}
              </div>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10.5px] font-black text-slate-700 uppercase tracking-wider ml-1">Village / Area Name</label>
              <input 
                className="w-full bg-slate-50/90 border border-slate-200/90 rounded-2xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-bold shadow-2xs placeholder:text-slate-400" 
                placeholder="Enter Area / Village" 
                type="text" 
                value={formData.area}
                onChange={(e) => setFormData({...formData, area: e.target.value})}
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10.5px] font-black text-slate-700 uppercase tracking-wider ml-1">Product Delivery Place</label>
              <div className="relative">
                <select 
                  className="w-full appearance-none bg-slate-50/90 border border-slate-200/90 rounded-2xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-bold shadow-2xs cursor-pointer"
                  value={formData.deliveryArea}
                  onChange={(e) => setFormData({...formData, deliveryArea: e.target.value})}
                >
                  <option>Home</option>
                  <option>Office</option>
                  <option>Pick-up Point</option>
                </select>
                <Icons.ExpandMore size={18} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
              </div>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10.5px] font-black text-slate-700 uppercase tracking-wider ml-1">House / Road / Street Details (Optional)</label>
              <textarea 
                className="w-full bg-slate-50/90 border border-slate-200/90 rounded-2xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-bold shadow-2xs resize-none placeholder:text-slate-400" 
                placeholder="e.g. House 42, Road 7, Block B" 
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>
          </div>
        </section>

        {/* Labels & Settings Card */}
        <section className="bg-white/80 border border-white/90 rounded-[28px] p-4 sm:p-5 shadow-[0_10px_40px_rgba(0,0,0,0.06),inset_0_1.5px_3px_rgba(255,255,255,1)] backdrop-blur-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-slate-900">Label Address As</h3>
              <p className="text-[10px] font-bold text-slate-500">Helps delivery riders locate quickly</p>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200/80">
              <button 
                type="button"
                onClick={() => setFormData({...formData, label: 'Home'})}
                className={`px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${formData.label === 'Home' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Home
              </button>
              <button 
                type="button"
                onClick={() => setFormData({...formData, label: 'Office'})}
                className={`px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${formData.label === 'Office' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Office
              </button>
            </div>
          </div>
          <div className="h-px bg-slate-100"></div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-slate-900">Set as default address</h3>
              <p className="text-[10px] font-bold text-slate-500">Auto-fills on Buy Now checkout</p>
            </div>
            <button 
              type="button"
              onClick={() => setFormData({...formData, isDefault: !formData.isDefault})}
              className={`w-11 h-6 rounded-full transition-all relative p-1 cursor-pointer ${formData.isDefault ? 'bg-emerald-600' : 'bg-slate-300'}`}
            >
              <motion.div 
                animate={{ x: formData.isDefault ? 20 : 0 }}
                className="w-4 h-4 bg-white rounded-full shadow-xs"
              />
            </button>
          </div>
        </section>
      </main>

      {/* Bottom Action Bar */}
      <footer className="fixed bottom-0 left-0 right-0 w-full max-w-xl mx-auto z-50 bg-white/80 backdrop-blur-2xl border-t border-slate-200/80 shadow-[0_-4px_30px_rgba(0,0,0,0.06)] px-4 sm:px-5 py-3.5 pb-safe">
        <button 
          type="button"
          onClick={() => onSave(formData)}
          className="w-full h-12 bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:from-emerald-600 text-white font-black rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/20 active:scale-98 transition-all uppercase tracking-widest text-xs cursor-pointer"
        >
          <Icons.Save size={18} />
          Save Address
        </button>
      </footer>
    </div>
  );
}


