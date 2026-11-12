/**
 * Reads an image file and returns a JPEG data URL no larger than `maxSide` px on its longest side.
 * Keeps phone photos well under the API's 10MB request limit and uploads fast on mobile data.
 */
export const resizeImageFile = (file: File, maxSide = 1600, quality = 0.86): Promise<string> =>
  new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please choose an image (JPG, PNG or WebP)"));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Could not process this image"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("This image format isn't supported by your browser. Try a JPG or PNG."));
    };
    img.src = url;
  });
