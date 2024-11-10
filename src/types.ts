export interface ServerData {
  cpuUsage: number;
  gpuUsage: number;
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
  gpuHistory: number[];
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

export interface ServerNode {
  id: string;
  name: string;
  ip: string;
  port: number;
  lastSeen: Date;
  isMaster: boolean;
  data: ServerData;
  compressedData?: Uint8Array;
}

export interface RegistryConfig {
  isMaster: boolean;
  masterUrl?: string;
  nodePort: number;
  frontendPort: number;
}