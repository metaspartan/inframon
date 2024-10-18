export interface ServerData {
  cpuUsage: number;
  memoryUsage: number;
  powerUsage: number;
  networkTraffic: {
    rx: number;
    tx: number;
  };
  localIp: string;
  cloudflaredRunning: boolean;
  timePoints: string[];
  cpuHistory: number[];
  memoryHistory: number[];
  powerHistory: number[];
  networkRxHistory: number[];
  networkTxHistory: number[];
  totalMemory: number;
  usedMemory: number;
  cpuCoreCount: number;
  systemName: string;
  uptime: string;
  cpuModel: string;
  storageInfo: {
    total: number;
    used: number;
    available: number;
  };
}