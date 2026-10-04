// Tuned to fit comfortably inside Supabase's free-tier 1 GB storage bucket:
// 2 photos/registration x ~180 KB worst case = ~720 MB at 2000 registrations,
// leaving headroom. MAX_DIMENSION is pulled in a bit alongside the lower
// target so quality doesn't collapse at the MIN_QUALITY floor — fewer pixels
// hit the same target size at a higher JPEG quality, so faces/ID text stay
// legible instead of getting blocky.
const MAX_DIMENSION = 900; // px, longest side
const TARGET_SIZE_BYTES = 180 * 1024; // 180 KB
const MIN_QUALITY = 0.5; // don't degrade below this even if still over target

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
  });
}

export async function compressImage(file: File): Promise<File> {
  // Non-images (shouldn't happen given accept="image/*", but just in case)
  // are passed through untouched.
  if (!file.type.startsWith('image/')) return file;

  const img = await loadImage(file);

  let { width, height } = img;
  if (width > height && width > MAX_DIMENSION) {
    height = Math.round((height * MAX_DIMENSION) / width);
    width = MAX_DIMENSION;
  } else if (height > MAX_DIMENSION) {
    width = Math.round((width * MAX_DIMENSION) / height);
    height = MAX_DIMENSION;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, width, height);

  let quality = 0.8;
  let blob = await canvasToBlob(canvas, quality);

  while (blob && blob.size > TARGET_SIZE_BYTES && quality > MIN_QUALITY) {
    quality -= 0.1;
    blob = await canvasToBlob(canvas, quality);
  }

  if (!blob) return file; // fall back to original if canvas export fails

  const compressedName = file.name.replace(/\.\w+$/, '') + '.jpg';
  return new File([blob], compressedName, { type: 'image/jpeg' });
}