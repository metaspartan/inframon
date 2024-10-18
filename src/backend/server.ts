import { ServerData } from '@/types';
import {
  getPowerUsage,
  getCpuUsage,
  getMemoryUsage,
  getNetworkTraffic,
  getLocalIp,
  isCloudflaredRunning,
} from './system_info';
import Bun from 'bun';

const server = Bun.serve({
  port: 3800,
  async fetch(req: Request) {
    // Add CORS headers
    const headers = new Headers({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    if (req.method === 'GET' && req.url.endsWith('/api/server-data')) {
      const now = new Date();
      const timePoints = Array.from({ length: 10 }, (_, i) => {
        const date = new Date(now.getTime() - i * 60000);
        return date.toLocaleTimeString();
      }).reverse();

      const serverData: ServerData = {
        cpuUsage: await getCpuUsage(),
        memoryUsage: await getMemoryUsage(),
        powerUsage: await getPowerUsage(),
        networkTraffic: await getNetworkTraffic(),
        localIp: await getLocalIp(),
        cloudflaredRunning: await isCloudflaredRunning(),
        timePoints,
        cpuHistory: Array.from({ length: 10 }, () => Math.floor(Math.random() * 100)),
        memoryHistory: Array.from({ length: 10 }, () => Math.floor(Math.random() * 100)),
      };

      return new Response(JSON.stringify(serverData), {
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not Found', { status: 404, headers });
  },
});

console.log(`Server running at http://localhost:${server.port}`);