export interface ServerData {
  cpuUsage: number;
  memoryUsage: number;
  powerUsage: number;
  networkTraffic: number;
  localIp: string;
  cloudflaredRunning: boolean;
  timePoints: string[];
  cpuHistory: number[];
  memoryHistory: number[];
}