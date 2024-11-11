import { BrowserRouter, Routes, Route, useParams, Link } from 'react-router-dom';
import { useEffect, useState, useContext } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import Dashboard from '@/components/Dashboard';
import { NodeList } from '@/components/NodeList';
import { ServerNode, ServerData, NodeWithData } from '@/types';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { decompressData } from '@/lib/utils';
import { NodesContext } from '@/contexts/NodesContext';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Slash } from 'lucide-react';
import { SortProvider } from '@/contexts/SortContext';


function DashboardWrapper() {
  const { nodeId } = useParams();
  const [nodes] = useContext(NodesContext);

  const nodeData = nodes.find(node => node.id === nodeId)?.data;

  if (!nodeData) {
    return <p className="text-center">Loading node data...</p>;
  }

  return <Dashboard data={nodeData} />;
}

function DynamicBreadcrumbs() {
  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <Link to="/" className="text-muted-foreground hover:text-foreground">Dashboard</Link>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        } 
      />
      <Route 
        path="/node/:nodeId" 
        element={<NodeBreadcrumbs />} 
      />
    </Routes>
  );
}

function NodeBreadcrumbs() {
  const { nodeId } = useParams();
  const [nodes] = useContext(NodesContext);
  
  const node = nodes.find(node => node.id === nodeId);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <Link to="/" className="text-muted-foreground hover:text-foreground">Dashboard</Link>
        </BreadcrumbItem>
        {nodeId && node && (
          <>
            <BreadcrumbSeparator>
              <Slash />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage className="text-muted-foreground">{node.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
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
                  gpuCoreCount: 0,
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
    <BrowserRouter>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <NodesContext.Provider value={[nodes, setNodes]}>
          <SortProvider>
            <SidebarProvider>
              <div className="flex h-screen w-screen overflow-hidden">
            <AppSidebar nodes={nodes} />
            <main className="flex-1 overflow-auto">
              <div className="p-4 w-full">
                <header className="mb-4 flex justify-between items-center">
                  <SidebarTrigger />
                  <DynamicBreadcrumbs />
                </header>
                <Routes>
                  <Route path="/" element={<NodeList nodes={nodes} />} />
                  <Route path="/node/:nodeId" element={<DashboardWrapper />} />
                </Routes>
              </div>
            </main>
              </div>
            </SidebarProvider>
          </SortProvider>
        </NodesContext.Provider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;