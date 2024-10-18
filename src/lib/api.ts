import { ServerData } from '@/types';

export async function fetchServerData(): Promise<ServerData> {
  const response = await fetch('http://192.168.1.99:3800/api/server-data');
  if (!response.ok) {
    throw new Error('Failed to fetch server data');
  }
  return response.json();
}