import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import Dashboard from '@/components/Dashboard';
import { NodeList } from '@/components/NodeList';
import { ServerNode, ServerData, NodeWithData } from '@/types';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { decompressData } from '@/lib/utils';

function DashboardWrapper() {
  const { nodeId } = useParams();
  const [serverData, setServerData] = useState<ServerData | null>(null);

  useEffect(() => {
    const fetchNodeData = async () => {
      try {
        const hostname = window.location.hostname;
        const response = await fetch(`http://${hostname}:3899/api/nodes/${nodeId}`);
        if (!response.ok) throw new Error('Failed to fetch node data');
        const data: ServerNode = await response.json();
        const decompressed = decompressData(data.compressedData ?? '') as ServerData;
        setServerData(decompressed);
      } catch (error) {
        console.error('Error fetching node data:', error);
      }
    };

    fetchNodeData();
    const interval = setInterval(fetchNodeData, 1000);
    return () => clearInterval(interval);
  }, [nodeId]);

  if (!serverData) {
    return <p className="text-center">Loading node data...</p>;
  }

  return <Dashboard data={serverData} />;
}

function App() {
  const [nodes, setNodes] = useState<NodeWithData[]>([]);

  useEffect(() => {
    const fetchNodes = async () => {
      try {
        const hostname = window.location.hostname;
        const response = await fetch(`http://${hostname}:3899/api/nodes`);
        if (!response.ok) throw new Error('Failed to fetch nodes');
        const nodeData: ServerNode[] = await response.json();

        // Transform ServerNode[] to NodeWithData[]
        const nodesWithData: NodeWithData[] = await Promise.all(
          nodeData.map(async (node) => {
            try {
              if (!node.compressedData) {
                console.error(`No compressed data for node ${node.id}`);
              }

              const decompressed = decompressData(node.compressedData ?? '') as ServerData;

              // Validate decompressed data matches ServerData interface
              const validatedData: ServerData = {
                cpuUsage: Number(decompressed.cpuUsage) || 0,
                gpuUsage: Number(decompressed.gpuUsage) || 0,
                memoryUsage: Number(decompressed.memoryUsage) || 0,
                powerUsage: Number(decompressed.powerUsage) || 0,
                networkTraffic: {
                  rx: Number(decompressed.networkTraffic?.rx) || 0,
                  tx: Number(decompressed.networkTraffic?.tx) || 0
                },
                localIp: String(decompressed.localIp || ''),
                cloudflaredRunning: Boolean(decompressed.cloudflaredRunning),
                timePoints: Array.isArray(decompressed.timePoints) ? decompressed.timePoints.slice(-60) : [],
                cpuHistory: Array.isArray(decompressed.cpuHistory) ? decompressed.cpuHistory.slice(-60).map(Number) : [],
                gpuHistory: Array.isArray(decompressed.gpuHistory) ? decompressed.gpuHistory.slice(-60).map(Number) : [],
                memoryHistory: Array.isArray(decompressed.memoryHistory) ? decompressed.memoryHistory.slice(-60).map(Number) : [],
                powerHistory: Array.isArray(decompressed.powerHistory) ? decompressed.powerHistory.slice(-60).map(Number) : [],
                networkRxHistory: Array.isArray(decompressed.networkRxHistory) ? decompressed.networkRxHistory.slice(-60).map(Number) : [],
                networkTxHistory: Array.isArray(decompressed.networkTxHistory) ? decompressed.networkTxHistory.slice(-60).map(Number) : [],
                totalMemory: Number(decompressed.totalMemory) || 0,
                usedMemory: Number(decompressed.usedMemory) || 0,
                cpuCoreCount: Number(decompressed.cpuCoreCount) || 0,
                systemName: String(decompressed.systemName || ''),
                uptime: String(decompressed.uptime || ''),
                cpuModel: String(decompressed.cpuModel || ''),
                storageInfo: {
                  total: Number(decompressed.storageInfo?.total) || 0,
                  used: Number(decompressed.storageInfo?.used) || 0,
                  available: Number(decompressed.storageInfo?.available) || 0
                }
              };

              return {
                ...node,
                data: validatedData
              };
            } catch (error) {
              console.error(`Failed to process data for node ${node.id}:`, error);
              // Return a node with default/empty data
              return {
                ...node,
                data: {
                  cpuUsage: 0,
                  gpuUsage: 0,
                  memoryUsage: 0,
                  powerUsage: 0,
                  networkTraffic: { rx: 0, tx: 0 },
                  localIp: '',
                  cloudflaredRunning: false,
                  timePoints: [],
                  cpuHistory: [],
                  gpuHistory: [],
                  memoryHistory: [],
                  powerHistory: [],
                  networkRxHistory: [],
                  networkTxHistory: [],
                  totalMemory: 0,
                  usedMemory: 0,
                  cpuCoreCount: 0,
                  systemName: 'Unknown',
                  uptime: '',
                  cpuModel: '',
                  storageInfo: { total: 0, used: 0, available: 0 }
                }
              };
            }
          })
        );

        setNodes(nodesWithData);
      } catch (error) {
        console.error('Error fetching nodes:', error);
      }
    };

    fetchNodes();
    const interval = setInterval(fetchNodes, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        <SidebarProvider>
          <AppSidebar nodes={nodes} />
          <div className="bg-background text-foreground min-h-screen">
            <div className="container mx-auto p-4">
              <header className="mb-4 flex justify-between items-center">
                <SidebarTrigger />
              </header>
              <Routes>
                <Route path="/" element={<NodeList nodes={nodes} />} />
                <Route path="/node/:nodeId" element={<DashboardWrapper />} />
              </Routes>
            </div>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;