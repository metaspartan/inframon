import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import { ServerData, ServerNode } from './src/types';
import {
  getPowerUsage,
  getCpuUsage,
  getGpuUsage,
  getMemoryUsage,
  getNetworkTraffic,
  getLocalIp,
  getTotalMemory,
  getUsedMemory,
  getCpuCoreCount,
  getSystemName,
  getUptime,
  getCpuModel,
  getStorageInfo,
  isCloudflaredRunning,
} from './system_info';
import { v4 as uuidv4 } from 'uuid';
import { compressData, decompressData } from './src/lib/utils';

const nodeId = uuidv4();
const app = express();
// const port = 3800;
const port = config.nodePort;
const FRONTEND_PORT = config.frontendPort;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const registryApp = express();
const REGISTRY_PORT = 3899;

registryApp.use(cors());
registryApp.use(express.json({ limit: '50mb' }));
registryApp.use(express.urlencoded({ limit: '50mb', extended: true }));

const nodes = new Map<string, ServerNode>();

registryApp.post('/api/nodes/register', (req, res) => {
  try {
    const node = req.body;
    if (!node.compressedData) {
      throw new Error('No compressed data received');
    }
    
    // Store the node with compressed data only
    const newNode: ServerNode = {
      id: node.id,
      name: node.name,
      ip: node.ip,
      port: node.port,
      lastSeen: new Date(),
      isMaster: node.isMaster,
      compressedData: node.compressedData
    };

    // Check if a node with this IP already exists (excluding the master node)
    const existingNode = Array.from(nodes.values()).find(
      n => n.ip === newNode.ip && !n.isMaster
    );

    if (existingNode) {
      // Update the existing node
      existingNode.lastSeen = new Date();
      existingNode.compressedData = node.compressedData;
      existingNode.name = node.name;
      nodes.set(existingNode.id, existingNode);
    } else {
      // Add new node
      nodes.set(newNode.id, newNode);
    }

    res.json({ success: true, message: 'Node registered' });
  } catch (error) {
    console.error('Error processing node registration:', error);
    res.status(500).json({ success: false, message: 'Error processing registration' });
  }
});

registryApp.get('/api/nodes', (req, res) => {
  const activeNodes = Array.from(nodes.values())
    .filter(node => new Date().getTime() - new Date(node.lastSeen).getTime() < 60000)
    .map(node => ({
      id: node.id,
      name: node.name,
      ip: node.ip,
      port: node.port,
      lastSeen: node.lastSeen,
      isMaster: node.isMaster,
      compressedData: node.compressedData // Send only compressed data
    }));
  res.json(activeNodes);
});

registryApp.get('/api/nodes/:nodeId', (req, res) => {
  const { nodeId } = req.params;
  const node = nodes.get(nodeId);
  
  if (!node || new Date().getTime() - new Date(node.lastSeen).getTime() >= 60000) {
    res.status(404).json({ error: 'Node not found or inactive' });
    return;
  }
  
  try {
    if (!node.compressedData) {
      throw new Error('No compressed data available');
    }

    const data = node;
    
    res.json(data);
  } catch (error) {
    console.error('Error processing node data:', error);
    res.status(500).json({ error: 'Failed to process node data', details: error.message });
  }
});

console.log(`Master Node: ${config.isMaster}`);

// Start registry server first if master
if (config.isMaster) {
  registryApp.listen(REGISTRY_PORT, async () => {
    console.log(`Master Enabled ✅ Registry server running on port ${REGISTRY_PORT}`);
    // Start the update history loop after registry is running
    updateHistory();
    setInterval(updateHistory, 1000);
  });
} else {
  // For non-master nodes, start update immediately
  updateHistory();
  setInterval(updateHistory, 1000);
}

const historyLength = 3600; // 1 hour of data (1 data point per second)
let cpuHistory: number[] = [];
let gpuHistory: number[] = [];
let memoryHistory: number[] = [];
let powerHistory: number[] = [];
let networkRxHistory: number[] = [];
let networkTxHistory: number[] = [];
let timePoints: string[] = [];

async function updateHistory() {
  const now = new Date();
  const timePoint = now.toLocaleTimeString();
  
  const [cpu, memory, power, network, gpu] = await Promise.all([
    getCpuUsage(),
    getMemoryUsage(),
    getPowerUsage(),
    getNetworkTraffic(),
    getGpuUsage()
  ]);

  cpuHistory.push(cpu);
  memoryHistory.push(memory);
  powerHistory.push(power);
  networkRxHistory.push(network.rx);
  networkTxHistory.push(network.tx);
  gpuHistory.push(gpu);
  timePoints.push(timePoint);

  if (cpuHistory.length > historyLength) cpuHistory.shift();
  if (memoryHistory.length > historyLength) memoryHistory.shift();
  if (powerHistory.length > historyLength) powerHistory.shift();
  if (networkRxHistory.length > historyLength) networkRxHistory.shift();
  if (networkTxHistory.length > historyLength) networkTxHistory.shift();
  if (gpuHistory.length > historyLength) gpuHistory.shift();
  if (timePoints.length > historyLength) timePoints.shift();

  // Create serverData object for both master and slave nodes
  const serverData: ServerData = {
    cpuUsage: cpu,
    gpuUsage: gpu,
    memoryUsage: memory,
    powerUsage: power,
    networkTraffic: network,
    localIp: await getLocalIp(),
    cloudflaredRunning: await isCloudflaredRunning(),
    timePoints,
    cpuHistory,
    gpuHistory,
    memoryHistory,
    powerHistory,
    networkRxHistory,
    networkTxHistory,
    totalMemory: await getTotalMemory(),
    usedMemory: await getUsedMemory(),
    cpuCoreCount: await getCpuCoreCount(),
    systemName: await getSystemName(),
    uptime: await getUptime(),
    cpuModel: await getCpuModel(),
    storageInfo: await getStorageInfo()
  };

  // Handle node registration based on master/slave status
  if (config.isMaster) {
    const compressedData = {
      ...serverData,
      // cpuHistory: serverData.cpuHistory.slice(-60),
      // gpuHistory: serverData.gpuHistory.slice(-60),
      // memoryHistory: serverData.memoryHistory.slice(-60),
      // powerHistory: serverData.powerHistory.slice(-60),
      // networkRxHistory: serverData.networkRxHistory.slice(-60),
      // networkTxHistory: serverData.networkTxHistory.slice(-60),
      // timePoints: serverData.timePoints.slice(-60)
    };
    // Master node updates its own data in the registry
    const node: ServerNode = {
      id: nodeId,
      name: await getSystemName(),
      ip: await getLocalIp(),
      port: config.nodePort,
      lastSeen: new Date(),
      isMaster: true,
      compressedData: compressData(compressedData) ?? ''
    };
    nodes.set(nodeId, node);

  } else {
    // Slave nodes register with master
    await registerWithMaster(serverData);
  }
}

// Update history every second
// setInterval(updateHistory, 1000);

async function registerWithMaster(serverData: ServerData) {
  if (!config.isMaster) {
    try {
      // Take only last 60 points for histories
      const compressedData = {
        ...serverData,
        // cpuHistory: serverData.cpuHistory.slice(-60),
        // gpuHistory: serverData.gpuHistory.slice(-60),
        // memoryHistory: serverData.memoryHistory.slice(-60),
        // powerHistory: serverData.powerHistory.slice(-60),
        // networkRxHistory: serverData.networkRxHistory.slice(-60),
        // networkTxHistory: serverData.networkTxHistory.slice(-60),
        // timePoints: serverData.timePoints.slice(-60)
      };

      // console.log('Compressed Data:', JSON.stringify(compressedData, null, 2));

      // console.log('Data before compression:', JSON.stringify(serverData, null, 2));

      const node = {
        id: nodeId,
        name: await getSystemName(),
        ip: await getLocalIp(),
        port: config.nodePort,
        lastSeen: new Date(),
        isMaster: false,
        compressedData: compressData(compressedData)
      };

      const response = await fetch(`${config.masterUrl}/api/nodes/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(node)
      });

      if (!response.ok) {
        throw new Error(`Failed to register with master: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to register with master:', error);
      setTimeout(() => registerWithMaster(serverData), 5000);
    }
  }
}

app.get('/api/local-ip', (req, res) => {
  const localIp = getLocalIp(); // Your existing function to get local IP
  res.json({ ip: localIp });
});


app.get('/api/server-data', async (req, res) => {
  const [totalMemory, usedMemory, cpuCoreCount] = await Promise.all([
    getTotalMemory(),
    getUsedMemory(),
    getCpuCoreCount(),
    getSystemName(),
    getUptime(),
    getCpuModel()
  ]);

  const serverData: ServerData = {
    cpuUsage: cpuHistory[cpuHistory.length - 1] || 0,
    gpuUsage: gpuHistory[gpuHistory.length - 1] || 0,
    memoryUsage: memoryHistory[memoryHistory.length - 1] || 0,
    powerUsage: powerHistory[powerHistory.length - 1] || 0,
    networkTraffic: {
      rx: networkRxHistory[networkRxHistory.length - 1] || 0,
      tx: networkTxHistory[networkTxHistory.length - 1] || 0
    },
    localIp: await getLocalIp(),
    cloudflaredRunning: await isCloudflaredRunning(),
    timePoints,
    cpuHistory,
    gpuHistory,
    memoryHistory,
    powerHistory,
    networkRxHistory,
    networkTxHistory,
    totalMemory,
    usedMemory,
    cpuCoreCount,
    systemName: await getSystemName(),
    uptime: await getUptime(),
    cpuModel: await getCpuModel(),
    storageInfo: await getStorageInfo()
  };

  res.json(serverData);
});

const localIp = await getLocalIp();

app.listen(port, () => {
  console.log(`Server Monitor server is running on http://${localIp}:${port}`);
});

// Initial history update
updateHistory();

// const FRONTEND_PORT = 3869;

// Frontend Static 
const frontendApp = express();
frontendApp.use(cors());
frontendApp.use(express.static(path.join(__dirname, 'dist')));

frontendApp.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

frontendApp.use((req, res, next) => {
  if (req.url.endsWith('.wasm')) {
    res.setHeader('Content-Type', 'application/wasm');
  } else if (req.url.endsWith('.js')) {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  }
  next();
});

const FPORT = FRONTEND_PORT;
frontendApp.listen(FPORT, () => {
  console.log(`Server Monitor is running on http://${localIp}:${FPORT}`);
});

// kill server monitor this app
process.on('SIGINT', () => {
  console.log('Server Monitor is shutting down');
  process.exit(0);
});