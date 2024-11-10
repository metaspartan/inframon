import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { useEffect, useState, useContext } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import Dashboard from '@/components/Dashboard';
import { NodeList } from '@/components/NodeList';
import { ServerNode, ServerData, NodeWithData } from '@/types';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { decompressData } from '@/lib/utils';
import { NodesContext } from '@/contexts/NodesContext';

function DashboardWrapper() {
  const { nodeId } = useParams();
  const [nodes, _] = useContext(NodesContext);

  const nodeData = nodes.find(node => node.id === nodeId)?.data;

  if (!nodeData) {
    return <p className="text-center">Loading node data...</p>;
  }

  return <Dashboard data={nodeData} />;
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

              return {
                ...node,
                data: decompressed
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
      <NodesContext.Provider value={[nodes, setNodes]}>
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
      </NodesContext.Provider>
    </ThemeProvider>
  );
}

export default App;