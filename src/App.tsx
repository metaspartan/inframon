import { useEffect, useState } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { ModeToggle } from '@/components/mode-toggle';
import Dashboard from '@/components/Dashboard';
import { ServerData } from '@/types';
import { fetchServerData } from '@/lib/api';

function App() {
  const [serverData, setServerData] = useState<ServerData | null>(null);

  useEffect(() => {
    const updateServerData = async () => {
      try {
        const data = await fetchServerData();
        setServerData(data);
      } catch (error) {
        console.error('Error fetching server data:', error);
      }
    };
  
    updateServerData();
    const interval = setInterval(updateServerData, 5000); // Update every 5 seconds
  
    return () => clearInterval(interval);
  }, []);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="container mx-auto p-4 max-w-5xl">
          <header className="mb-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold">Server⚡Monitor</h1>
            <ModeToggle />
          </header>
          <main>
            {serverData ? (
              <Dashboard data={serverData} />
            ) : (
              <p className="text-center">Loading server data...</p>
            )}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;