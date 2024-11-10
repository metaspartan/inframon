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
      console.log('Master discovery service started');
    });
  }

  async discoverMaster(): Promise<string> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 5;
      const timeout = 2000;
      const subnet = this.getSubnet();

      const attemptDiscovery = async (ip: string) => {
        try {
          const socket = new net.Socket();
          const connectPromise = new Promise<void>((resolve, reject) => {
            socket.setTimeout(500); // 500ms timeout per connection attempt
            
            socket.on('connect', () => {
              socket.write('INFRAMON_DISCOVERY');
            });

            socket.on('data', (data) => {
              try {
                const response = JSON.parse(data.toString());
                if (response.type === 'MASTER_ANNOUNCE') {
                  this.masterUrl = response.url;
                  socket.end();
                  resolve();
                }
              } catch (err) {
                socket.end();
                reject(err);
              }
            });

            socket.on('timeout', () => {
              socket.destroy();
              reject(new Error('Connection timeout'));
            });

            socket.on('error', () => {
              socket.destroy();
              reject(new Error('Connection failed'));
            });
          });

          socket.connect(DISCOVERY_PORT, ip);
          await connectPromise;
          if (this.masterUrl) {
            resolve(this.masterUrl);
            return true;
          }
        } catch (error) {
          return false;
        }
        return false;
      };

      const scanNetwork = async () => {
        if (attempts >= maxAttempts) {
          reject(new Error('No master node found'));
          return;
        }

        attempts++;
        
        // Scan the last octet of the subnet
        for (let i = 1; i <= 254; i++) {
          const ip = `${subnet}${i}`;
          if (await attemptDiscovery(ip)) {
            return;
          }
        }

        setTimeout(scanNetwork, timeout);
      };

      scanNetwork();
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