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
  deviceCapabilities: {
    model: string;
    chip: string;
    memory: number;
    flops: {
      fp32: number;
      fp16: number;
      int8: number;
    };
  };
  logs: string;
}

export enum NodeStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting'
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
  status: NodeStatus;
  // lastHeartbeat: Date | null;
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

export interface DeviceFlops {
  fp32: number;
  fp16: number;
  int8: number;
}

export interface DeviceCapabilities {
  model: string;
  chip: string;
  memory: number;  // in MB
  flops: DeviceFlops;
}