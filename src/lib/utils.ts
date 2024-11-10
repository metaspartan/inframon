import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function compressData(data: any): string | null {
  try {
    if (!data) return null;
    const jsonString = JSON.stringify(data);
    if (!jsonString || jsonString === '""') return null;
    return btoa(jsonString);
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
    // console.log(compressed);
    const jsonString = atob(compressed);
    if (!jsonString || jsonString === '""') {
      throw new Error('Empty decompressed data');
    }
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Decompression error:', error);
    // throw error;
    return null;
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
