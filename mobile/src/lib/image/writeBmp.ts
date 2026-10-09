import ReactNativeBlobUtil from 'react-native-blob-util';

import { bytesToBase64 } from '@/utils/base64';

type RawImage = { data: Uint8Array; width: number; height: number; format: 'rgb' | 'rgba' | 'bgr' | 'bgra' | 'gray' };

/**
 * Writes a raw pixel buffer (ExecuTorch image output) as a 24-bit BMP so <Image> can show it. BMP needs no compression code.
 * @param image raw HWC pixels
 * @returns local file path of the written BMP
 */
export async function writeBmp(image: RawImage): Promise<string> {
  const { data, width, height, format } = image;
  const channels = format === 'gray' ? 1 : format.length;
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const out = new Uint8Array(54 + rowSize * height);
  const view = new DataView(out.buffer);
  view.setUint8(0, 0x42);
  view.setUint8(1, 0x4d);
  view.setUint32(2, out.length, true);
  view.setUint32(10, 54, true);
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(34, rowSize * height, true);

  const isBgr = format.startsWith('bgr');
  for (let y = 0; y < height; y++) {
    const dstRow = 54 + (height - 1 - y) * rowSize;
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * channels;
      const a = data[src] ?? 0;
      const b = channels === 1 ? a : (data[src + 1] ?? 0);
      const c = channels === 1 ? a : (data[src + 2] ?? 0);
      const [r, g, bl] = isBgr ? [c, b, a] : [a, b, c];
      out[dstRow + x * 3] = bl;
      out[dstRow + x * 3 + 1] = g;
      out[dstRow + x * 3 + 2] = r;
    }
  }
  const path = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/gen-${Date.now()}.bmp`;
  await ReactNativeBlobUtil.fs.writeFile(path, bytesToBase64(out), 'base64');
  return path;
}
