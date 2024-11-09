import { ServerData } from '@/types';

const API_PORT = 3800;

export async function fetchServerData(): Promise<ServerData> {
  try {
    // Get Local Host IP Address from the browser input e.g. http://192.168.1.250:3869/
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    // console.log('hostname', hostname);
    
    if (!hostname) {
      throw new Error('Could not determine server hostname');
    }
    
    const response = await fetch(`http://${hostname.toString()}:${API_PORT}/api/server-data`);
    if (!response.ok) {
      throw new Error('Failed to fetch server data');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching server data:', error);
    throw error;
  }
}