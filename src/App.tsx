import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import Dashboard from '@/components/Dashboard';
import { NodeList } from '@/components/NodeList';
import { ServerNode, ServerData } from '@/types';
import { fetchServerData } from '@/lib/api';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

function DashboardWrapper() {
  const { nodeId } = useParams();
  const [serverData, setServerData] = useState<ServerData | null>(null);

  useEffect(() => {
    const fetchNodeData = async () => {
      try {
        const data = await fetchServerData();
        setServerData(data);
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
  const [nodes, setNodes] = useState<ServerNode[]>([]);

  useEffect(() => {
    const fetchNodes = async () => {
      try {
        const hostname = window.location.hostname;
        const response = await fetch(`http://${hostname}:3899/api/nodes`);
        if (!response.ok) throw new Error('Failed to fetch nodes');
        const nodeData = await response.json();
        setNodes(nodeData);
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
              {/* <a href="/"><h1 className="text-3xl font-bold dark:text-white text-black ml-4">Infra⚡Mon</h1></a>
              <ModeToggle /> */}
            </header>
            <Routes>
              <Route path="/" element={<NodeList nodes={nodes} />} />
              <Route path="/node/:nodeId" element={<DashboardWrapper />} />
            </Routes>
            {/* <footer className="mt-8 text-center text-sm text-muted-foreground">
              <p>Server⚡Monitor</p>
              By Carsen Klock on <a href="https://github.com/metaspartan/servermon" className="hover:underline" target="_blank" rel="noopener noreferrer">Github</a>
            </footer> */}
          </div>
        </div>
        </SidebarProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;