// Copyright 2024 Carsen Klock
// Licensed under the MIT License
// https://github.com/metaspartan/inframon

import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import { NodeStatus, ServerData, ServerNode } from './src/types';
import { logger } from './src/lib/logger';
import {
  getPowerUsage,
  getCpuUsage,
  getGpuUsage,
  getGpuCoreCount,
  getMemoryUsage,
  getNetworkTraffic,
  getLocalIp,
  getTotalMemory,
  getUsedMemory,
  getCpuCoreCount,
  getOs,
  getSystemName,
  getDeviceCapabilities,
  getUptime,
  getCpuModel,
  getStorageInfo,
  isCloudflaredRunning,
  getInframonLogs,
  changeHostname,
} from './system_info';
import { v4 as uuidv4 } from 'uuid';
import { compressData } from './src/lib/utils';
import { NodeDiscovery } from './src/lib/discovery';

const discovery = new NodeDiscovery();

const nodeId = uuidv4();
const app = express();

const port = config.nodePort;
const FRONTEND_PORT = config.frontendPort;

logger; 

console.log('Inframon is starting');

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
    
    const newNode: ServerNode = {
      id: node.id,
      name: node.name,
      os: node.os,
      ip: node.ip,
      port: node.port,
      lastSeen: new Date(),
      status: NodeStatus.CONNECTING,
      isMaster: node.isMaster,
      compressedData: node.compressedData
    };

    const existingNode = Array.from(nodes.values()).find(
      n => n.ip === newNode.ip && !n.isMaster
    );

    if (existingNode) {
      existingNode.lastSeen = new Date();
      existingNode.status = NodeStatus.CONNECTED;
      existingNode.compressedData = node.compressedData;
      existingNode.name = node.name;
      nodes.set(existingNode.id, existingNode);
    } else {
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
      os: node.os,
      ip: node.ip,
      port: node.port,
      lastSeen: node.lastSeen,
      isMaster: node.isMaster,
      status: node.status,
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

registryApp.post('/api/nodes/:nodeId/hostname', async (req, res) => {
  const { nodeId } = req.params;
  const { hostname } = req.body;
  const node = nodes.get(nodeId);

  if (!node) {
    res.status(404).json({ error: 'Node not found' });
    return;
  }

  try {
    // Forward the hostname change request to the actual node
    console.log(`Forwarding hostname change to node ${node.ip}:${node.port}`);
    const response = await fetch(`http://${node.ip}:${node.port}/api/hostname`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostname })
    });

    if (!response.ok) {
      throw new Error(`Failed to change hostname on node: ${response.status}`);
    }

    // Update the node name in our registry
    node.name = hostname;
    nodes.set(nodeId, node);
    res.json({ success: true });
  } catch (error) {
    console.error('Error changing hostname:', error);
    res.status(500).json({ error: 'Failed to change hostname' });
  }
});

registryApp.delete('/api/nodes/:nodeId', (req, res) => {
  const { nodeId } = req.params;
  
  try {
    const node = nodes.get(nodeId);
    if (!node) {
      res.status(404).json({ error: 'Node not found' });
      return;
    }

    nodes.delete(nodeId);
    res.json({ success: true, message: 'Node removed' });
  } catch (error) {
    console.error('Error removing node:', error);
    res.status(500).json({ error: 'Failed to remove node' });
  }
});

registryApp.post('/api/nodes/:nodeId/heartbeat', (req, res) => {
  const { nodeId } = req.params;
  const node = nodes.get(nodeId);
  
  if (node) {
    // node.lastHeartbeat = new Date();
    node.status = NodeStatus.CONNECTED;
    nodes.set(nodeId, node);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Node not found' });
  }
});

console.log(`Master Node: ${config.isMaster}`);

// Start registry server first if master
if (config.isMaster) {
  registryApp.listen(REGISTRY_PORT, async () => {
    console.log(`✅ Master Node Enabled running on port ${REGISTRY_PORT}`);
    // Start discovery service
    await discovery.startMaster();
    // Start the update history loop after registry is running
    updateHistory();
    setInterval(updateHistory, 1000);
    // setInterval(checkNodeStatus, 5000);
  });
} else {
  // For non-master nodes, discover master and start update
  try {
    console.log('Discovering master node...');
    const masterUrl = await discovery.discoverMaster();
    config.masterUrl = masterUrl;
    console.log(`✅ Found master node at ${masterUrl}`);
    updateHistory();
    setInterval(updateHistory, 1000);
  } catch (error) {
    console.error('Failed to discover master node:', error.message);
    console.error('Please ensure the master node is running and accessible on the network');
    process.exit(1);
  }
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
    gpuCoreCount: await getGpuCoreCount(),
    systemName: await getSystemName(),
    uptime: await getUptime(),
    cpuModel: await getCpuModel(),
    storageInfo: await getStorageInfo(),
    deviceCapabilities: await getDeviceCapabilities(),
    logs: await getInframonLogs()
  };

  // Handle node registration based on master/slave status
  if (config.isMaster) {
    const compressedData = {
      ...serverData,
    };
    // Master node updates its own data in the registry
    const node: ServerNode = {
      id: nodeId,
      name: await getSystemName(),
      os: await getOs(),
      ip: await getLocalIp(),
      port: config.nodePort,
      lastSeen: new Date(),
      isMaster: true,
      status: NodeStatus.CONNECTED,
      compressedData: compressData(compressedData) ?? ''
    };
    nodes.set(nodeId, node);

  } else {
    // Slave nodes register with master
    await registerWithMaster(serverData);
  }
}

async function registerWithMaster(serverData: ServerData) {
  if (!config.isMaster) {
    try {
      const compressedData = {
        ...serverData,
      };

      const node = {
        id: nodeId,
        name: await getSystemName(),
        os: await getOs(),
        ip: await getLocalIp(),
        port: config.nodePort,
        lastSeen: new Date(),
        isMaster: false,
        status: NodeStatus.CONNECTED,
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
  const localIp = getLocalIp();
  res.json({ ip: localIp });
});

app.post('/api/hostname', async (req, res) => {
  const { hostname } = req.body;
  try {
    console.log(`Changing hostname to: ${hostname}`);
    await changeHostname(hostname);
    res.json({ success: true });
  } catch (error) {
    console.error('Error changing hostname:', error);
    res.status(500).json({ error: 'Failed to change hostname' });
  }
});

app.get('/api/server-data', async (req, res) => {
  const [totalMemory, usedMemory, cpuCoreCount, gpuCoreCount] = await Promise.all([
    getTotalMemory(),
    getUsedMemory(),
    getCpuCoreCount(),
    getGpuCoreCount(),
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
    gpuCoreCount,
    systemName: await getSystemName(),
    uptime: await getUptime(),
    cpuModel: await getCpuModel(),
    storageInfo: await getStorageInfo(),
    deviceCapabilities: await getDeviceCapabilities(),
    logs: await getInframonLogs()
  };

  res.json(serverData);
});

const localIp = await getLocalIp();

app.listen(port, () => {
  console.log(`Inframon API server is running on http://${localIp}:${port}`);
});

// Initial history update
updateHistory();

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
  console.log(`Inframon frontend is running on http://${localIp}:${FPORT}`);
});

// kill inframon
process.on('SIGINT', () => {
  console.log('Inframon is shutting down');
  nodes.clear();
  discovery.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Inframon is shutting down');
  nodes.clear();
  discovery.close();
  process.exit(0);
});

process.on('SIGKILL', () => {
  console.log('Inframon is being killed');
  nodes.clear();
  discovery.close();
  process.exit(0);
});