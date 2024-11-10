import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ServerData } from '../types';
import Bun from 'bun';

export function compressData(data: any): string {
  const jsonString = JSON.stringify(data);
  const buf = Buffer.from(jsonString);
  const compressed = Bun.gzipSync(buf);
  return Buffer.from(compressed).toString('base64');
}

export function decompressData(compressed: string): any {
  try {
    const buffer = Buffer.from(compressed, 'base64');
    const decompressed = Bun.gunzipSync(buffer);
    return JSON.parse(decompressed.toString());
  } catch (error) {
    console.error('Decompression error:', error);
    throw error;
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
