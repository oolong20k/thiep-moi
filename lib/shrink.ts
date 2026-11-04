/**
 * Nén ảnh ở trình duyệt trước khi tải lên: Vercel giới hạn body request ~4.5MB, ảnh điện thoại thường 5–10MB.
 * Xuất webp để giữ kênh alpha (ảnh PNG đã tách nền). Không nén được thì trả file gốc.
 */
export async function shrink(file: File, max = 1600): Promise<File> {
  if (file.size < 1.5 * 1024 * 1024) return file;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * k);
    c.height = Math.round(bmp.height * k);
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/webp', 0.85));
    return blob && blob.size < file.size ? new File([blob], file.name.replace(/\.\w+$/, '') + '.webp', { type: 'image/webp' }) : file;
  } catch {
    return file;
  }
}
