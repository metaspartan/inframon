import net from 'net';
import { getLocalIp } from '../../system_info';

const DISCOVERY_PORT = 3898; // Just before registry port

export class NodeDiscovery {
  private server: net.Server | null = null;
  private masterUrl: string | null = null;

  async startMaster() {
    this.server = net.createServer((socket) => {
      socket.on('data', async (data) => {
        if (data.toString() === 'INFRAMON_DISCOVERY') {
          const localIp = await getLocalIp();
          console.log(`Received discovery request from ${socket.remoteAddress}`);
          const response = JSON.stringify({
            type: 'MASTER_ANNOUNCE',
            url: `http://${localIp}:3899`
          });
          socket.write(response);
          socket.end();
        }
      });
    });
  
    this.server.listen(DISCOVERY_PORT, '0.0.0.0', () => {
      console.log(`Master discovery service started on port ${DISCOVERY_PORT}`);
    });
  }

  async discoverMaster(): Promise<string> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 5;
      const timeout = 2000;
      const subnet = this.getSubnet();
      let activeConnections = 0;
      const maxConcurrentConnections = 50;
      let foundMaster = false;
  
      const attemptDiscovery = async (ip: string) => {
        if (foundMaster) return;
        
        try {
          const socket = new net.Socket();
          activeConnections++;
  
          const cleanup = () => {
            activeConnections--;
            socket.destroy();
            if (activeConnections === 0 && attempts >= maxAttempts && !foundMaster) {
              reject(new Error('No master node found after all attempts'));
            }
          };
  
          socket.setTimeout(1000); // 1 second timeout
  
          socket.on('connect', () => {
            console.log(`Attempting connection to potential master at ${ip}`);
            socket.write('INFRAMON_DISCOVERY');
          });
  
          socket.on('data', (data) => {
            try {
              const response = JSON.parse(data.toString());
              if (response.type === 'MASTER_ANNOUNCE') {
                foundMaster = true;
                this.masterUrl = response.url;
                console.log(`Found master at ${response.url}`);
                cleanup();
                resolve(response.url);
              }
            } catch (err) {
              cleanup();
            }
          });
  
          socket.on('timeout', () => {
            cleanup();
          });
  
          socket.on('error', () => {
            cleanup();
          });
  
          socket.connect(DISCOVERY_PORT, ip);
        } catch (error) {
          activeConnections--;
        }
      };
  
      const scanNetwork = async () => {
        if (attempts >= maxAttempts || foundMaster) {
          if (!foundMaster) {
            reject(new Error('No master node found'));
          }
          return;
        }
  
        attempts++;
        console.log(`Scanning network attempt ${attempts}/${maxAttempts}...`);
  
        // Scan in batches to avoid too many concurrent connections
        for (let i = 1; i <= 254; i += maxConcurrentConnections) {
          if (foundMaster) break;
          
          const promises = [];
          for (let j = i; j < i + maxConcurrentConnections && j <= 254; j++) {
            const ip = `${subnet}${j}`;
            promises.push(attemptDiscovery(ip));
          }
          
          await Promise.all(promises);
          
          if (!foundMaster) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between batches
          }
        }
  
        if (!foundMaster) {
          setTimeout(scanNetwork, timeout);
        }
      };
  
      scanNetwork().catch(reject);
    });
  }

  private getSubnet(): string {
    const interfaces = require('os').networkInterfaces();
    for (const iface of Object.values(interfaces)) {
      for (const alias of iface as any) {
        if (alias.family === 'IPv4' && !alias.internal) {
          // Get the first three octets of the IP address
          return alias.address.split('.').slice(0, 3).join('.') + '.';
        }
      }
    }
    return '192.168.1.'; // Fallback to common subnet
  }

  close() {
    if (this.server) {
      this.server.close();
    }
  }
}