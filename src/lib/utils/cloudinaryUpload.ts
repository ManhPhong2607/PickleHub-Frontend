import { reviewApi } from '@/lib/api/reviewApi';

/**
 * Universal Cloudinary Image Uploader
 * 1. Attempts signed Cloudinary upload using signature from Backend.
 * 2. If Cloudinary credentials are not configured or request fails, fallbacks to local Base64 / Data URL.
 * 3. Never throws unhandled exception that blocks form submission.
 */
export async function uploadImageToCloudinary(file: File): Promise<string> {
  try {
    // 1. Try to get signature from backend
    const signatureData = await reviewApi.getUploadSignature();
    if (signatureData && signatureData.cloudName && signatureData.apiKey) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signatureData.apiKey);
      formData.append('timestamp', signatureData.timestamp.toString());
      formData.append('signature', signatureData.signature);
      formData.append('folder', signatureData.folder);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (response.ok) {
        const json = await response.json();
        if (json.secure_url) {
          return json.secure_url;
        }
      }
    }
  } catch (err) {
    console.warn('[CloudinaryUpload] Signed upload error, falling back to FileReader:', err);
  }

  // 2. Fallback to FileReader Data URL
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(typeof reader.result === 'string' ? reader.result : '/images/paddle.png');
    };
    reader.onerror = () => {
      resolve('/images/paddle.png');
    };
    reader.readAsDataURL(file);
  });
}
