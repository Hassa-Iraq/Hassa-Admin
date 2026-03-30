/**
 * Canvas helpers for image cropping (react-easy-crop pixel crop). Shared by banners, restaurants, etc.
 */

export function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });
}

/**
 * @param {string} imageSrc Object URL or remote URL
 * @param {{ x: number; y: number; width: number; height: number }} pixelCrop
 */
export async function getCroppedImageBlob(imageSrc, pixelCrop, mimeType = 'image/jpeg', quality = 0.92) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported in this browser.');
  const { x, y, width, height } = pixelCrop;
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('Could not create image file.'));
        else resolve(blob);
      },
      mimeType,
      quality
    );
  });
}

/**
 * Shrinks image blob if it exceeds maxBytes (iterative downscale + jpeg quality).
 */
export async function ensureBlobMaxSize(blob, maxBytes, maxEdge = 1920) {
  if (blob.size <= maxBytes) return blob;
  const url = URL.createObjectURL(blob);
  try {
    const img = await createImage(url);
    let w = img.width;
    let h = img.height;
    const longest = Math.max(w, h);
    const scale0 = Math.min(1, maxEdge / longest);
    w = Math.max(1, Math.floor(w * scale0));
    h = Math.max(1, Math.floor(h * scale0));

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return blob;

    let quality = 0.88;
    for (let i = 0; i < 12; i++) {
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      const out = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Compress failed'))), 'image/jpeg', quality);
      });
      if (out.size <= maxBytes) return out;
      w = Math.max(1, Math.floor(w * 0.82));
      h = Math.max(1, Math.floor(h * 0.82));
      quality = Math.max(0.42, quality - 0.07);
    }
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(img, 0, 0, w, h);
    return new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Compress failed'))), 'image/jpeg', 0.42);
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
