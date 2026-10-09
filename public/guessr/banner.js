const MAX_BYTES = 24576;
// Flatten transparency and discard metadata; only a small raster JPEG leaves the browser.
export async function prepareBanner(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw Error('Choose a JPEG, PNG or WebP image.');
  if (file.size > 10 * 1024 * 1024) throw Error('Choose an image smaller than 10 MB.');
  const url = URL.createObjectURL(file);
  const image = new Image();
  try {
    image.src = url;
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight) throw Error('This image could not be read.');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw Error('Image processing is unavailable in this browser.');
    let width = Math.min(1200, image.naturalWidth);
    // Center-crop to the board's wide banner shape.
    const cropWidth = Math.min(image.naturalWidth, image.naturalHeight * 3);
    const cropHeight = cropWidth / 3;
    for (let attempt = 0; attempt < 5; attempt++) {
      canvas.width = Math.round(width); canvas.height = Math.round(width / 3);
      context.fillStyle = '#fafcf9'; context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, (image.naturalWidth - cropWidth) / 2, (image.naturalHeight - cropHeight) / 2, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .75));
      if (!blob) throw Error('This image could not be processed.');
      if (blob.size <= MAX_BYTES) return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(Error('This image could not be read.'));
        reader.readAsDataURL(blob);
      });
      width *= .75;
    }
    throw Error('This image is too detailed. Try a simpler image.');
  } catch (error) {
    throw new Error(error.message || 'This image could not be read.');
  } finally { URL.revokeObjectURL(url); }
}
