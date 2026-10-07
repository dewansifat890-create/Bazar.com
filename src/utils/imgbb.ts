export const DEFAULT_IMGBB_API_KEY = '8e054221c71856655f7deb752b6f47d8';

/**
 * Uploads a file or base64 image string to ImgBB CDN seamlessly in the background.
 * Returns the permanent hosted image URL (e.g. https://i.ibb.co/...).
 */
export async function uploadToImgBB(fileOrBase64: File | string, customApiKey?: string): Promise<string> {
  const envKey = (import.meta as any)?.env?.VITE_IMGBB_API_KEY;
  const key = customApiKey || envKey || DEFAULT_IMGBB_API_KEY;
  const formData = new FormData();

  if (typeof fileOrBase64 === 'string') {
    // Clean base64 header if present (e.g., data:image/png;base64,...)
    const base64Clean = fileOrBase64.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '');
    formData.append('image', base64Clean);
  } else {
    formData.append('image', fileOrBase64);
  }

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    body: formData,
  });

  const resJson = await response.json();
  if (resJson && resJson.success && resJson.data) {
    return resJson.data.display_url || resJson.data.url;
  }

  throw new Error(resJson?.error?.message || 'ImgBB image upload failed');
}
