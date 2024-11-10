import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ServerData } from '../types';
import Bun from 'bun';

export function compressData(data: ServerData) {
  const jsonString = JSON.stringify(data);
  const buf = Buffer.from(jsonString);
  return Bun.gzipSync(buf);
}

export function decompressData(compressed: Uint8Array): ServerData {
  const decompressed = Bun.gunzipSync(compressed);
  const jsonString = new TextDecoder().decode(decompressed);
  return JSON.parse(jsonString);
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
