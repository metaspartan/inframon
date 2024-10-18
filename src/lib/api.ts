import { ServerData } from '@/types';

export async function fetchServerData(): Promise<ServerData> {
  const response = await fetch('http://localhost:3800/api/server-data');
  if (!response.ok) {
    throw new Error('Failed to fetch server data');
  }
  return response.json();
}