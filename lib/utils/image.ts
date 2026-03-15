const MAX_DIMENSION = 1920;
const MAX_BYTES = 1.8 * 1024 * 1024; // target under 1.8MB

/**
 * Resizes and compresses an image File using the Canvas API.
 * Caps the longest edge at MAX_DIMENSION px and encodes as JPEG.
 * Returns a new File ready to upload.
 */
export async function compressImage(file: File): Promise<File> {
  const img = await loadImage(file);

  let { width, height } = img;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_DIMENSION) / width);
      width = MAX_DIMENSION;
    } else {
      width = Math.round((width * MAX_DIMENSION) / height);
      height = MAX_DIMENSION;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, width, height);

  // Try high quality first, fall back to lower if still too large
  let blob = await canvasToBlob(canvas, 0.82);
  if (blob && blob.size > MAX_BYTES) {
    blob = await canvasToBlob(canvas, 0.65);
  }

  if (!blob) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}
