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
  gpuCoreCount: number;
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
  os: string;
  ip: string;
  port: number;
  lastSeen: Date;
  isMaster: boolean;
  compressedData?: string;
}

export interface NodeWithData extends ServerNode {
  data: ServerData;
}

export interface RegistryConfig {
  isMaster: boolean;
  masterUrl?: string;
  nodePort: number;
  frontendPort: number;
}

export type SortOption = 'master' | 'name' | 'cpu' | 'gpu' | 'memory' | 'power';
export type SortDirection = 'asc' | 'desc';
export type OSFilter = 'all' | 'macos' | 'linux';
export type NodeTypeFilter = 'all' | 'master' | 'worker';

export interface SortPreferences {
  sortBy: SortOption;
  direction: SortDirection;
  order: string[];
  osFilter: OSFilter;
  nodeTypeFilter: NodeTypeFilter;
}