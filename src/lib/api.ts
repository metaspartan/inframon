import { ServerData } from '@/types';

const API_PORT = 3800;
const SERVER_IP = '192.168.1.99';

export async function fetchServerData(): Promise<ServerData> {
  try {
    const serverIp = SERVER_IP;

    const response = await fetch(`http://${serverIp}:${API_PORT}/api/server-data`);
    if (!response.ok) {
      throw new Error('Failed to fetch server data');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching server data:', error);
    throw error;
  }
}