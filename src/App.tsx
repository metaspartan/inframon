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
    const interval = setInterval(updateServerData, 1000); // Update every 1 seconds
  
    return () => clearInterval(interval);
  }, []);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="bg-background text-foreground flex items-center justify-center">
        <div className="container mx-auto p-4 max-w-5xl">
          <header className="mb-8 flex justify-between items-center mt-8">
            <h1 className="text-3xl font-bold ml-2">Server⚡Monitor</h1>
            <ModeToggle />
          </header>
          <main>
            {serverData ? (
              <Dashboard data={serverData} />
            ) : (
              <p className="text-center">Loading server data...</p>
            )}
          </main>
          <footer className="mt-8 text-center text-sm text-gray-500">
            <p>Server⚡Monitor</p> By Carsen Klock on <a href="https://github.com/metaspartan/servermon" target="_blank" rel="noopener noreferrer">Github</a>
          </footer>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;