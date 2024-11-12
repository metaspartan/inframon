import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import pako from 'pako';

export function compressData(data: any): string | null {
  try {
    if (!data) return null;
    const jsonString = JSON.stringify(data);
    if (!jsonString || jsonString === '""') return null;
    // Convert string to Uint8Array first
    const uint8Array = new TextEncoder().encode(jsonString);
    // Use deflateRaw instead of deflate
    const compressed = pako.deflateRaw(uint8Array);
    // Convert to base64 in chunks to avoid call stack size exceeded
    const chunkSize = 8192;
    let result = '';
    for (let i = 0; i < compressed.length; i += chunkSize) {
      const chunk = compressed.slice(i, i + chunkSize);
      result += String.fromCharCode.apply(null, Array.from(chunk));
    }
    return btoa(result);
  } catch (error) {
    console.error('Compression error:', error);
    return null;
  }
}

export function decompressData(compressed: string | null | undefined): any {
  try {
    if (!compressed || compressed === '') {
      throw new Error('Empty compressed data');
    }
    // Convert base64 to binary string
    const binaryString = atob(compressed);
    // Convert binary string to Uint8Array
    const uint8Array = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i);
    }
    // Use inflateRaw instead of inflate
    const decompressed = pako.inflateRaw(uint8Array);
    // Convert back to string
    const jsonString = new TextDecoder().decode(decompressed);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Decompression error:', error);
    return null;
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
