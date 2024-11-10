import { NodeWithData } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { useNavigate } from 'react-router-dom';
import { Progress } from './ui/progress';
import { CpuIcon, Server, NetworkIcon, ZapIcon } from 'lucide-react';
import { BsGpuCard, BsFillNvmeFill } from "react-icons/bs";
import { FaMemory, FaEthernet, FaCloudflare } from "react-icons/fa";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { ModeToggle } from './mode-toggle';

export function NodeList({ nodes }: { nodes: NodeWithData[] }) {
  const navigate = useNavigate();
  const isAppleSilicon = (cpuModel: string) => cpuModel.toLowerCase().includes('apple');

  if (!nodes.length) {
    return (
      <div className="container mx-auto p-4">
        <p className="text-center text-muted-foreground">No nodes found...</p>
      </div>
    );
  }

  const sortNodesWithMasterFirst = (nodes: NodeWithData[]) => {
    return [...nodes].sort((a, b) => {
      if (a.isMaster && !b.isMaster) return -1;
      if (!a.isMaster && b.isMaster) return 1;
      return 0;
    });
  };

  const totalPowerUsage = nodes.reduce((acc, node) => acc + node.data.powerUsage, 0);
  const powerHistory = nodes.reduce((acc, node) => {
    const history = node.data.powerHistory || [];
    return acc.map((total, i) => total + (history[i] || 0));
  }, new Array(30).fill(0));

  const sparklineData = powerHistory.map((value) => ({ value }));

  const totalMemoryUsage = nodes.reduce((acc, node) => acc + node.data.usedMemory, 0);
  const totalMemoryCapacity = nodes.reduce((acc, node) => acc + node.data.totalMemory, 0);
  const averageCpuUsage = nodes.reduce((acc, node) => acc + node.data.cpuUsage, 0) / nodes.length;

  const memoryHistory = nodes.reduce((acc, node) => {
    const history = node.data.memoryHistory || [];
    return acc.map((total, i) => total + (history[i] || 0));
  }, new Array(30).fill(0));

  const cpuHistory = nodes.reduce((acc, node) => {
    const history = node.data.cpuHistory || [];
    return acc.map((total, i) => (total + (history[i] || 0)) / nodes.length);
  }, new Array(30).fill(0));

  return (<>
  <div className="w-full max-w-full mt-2">
  <div className="mb-4">
  <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3 max-w-full mb-4 w-full min-w-full">
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Total Power Usage</CardTitle>
        <ZapIcon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          <div className="text-2xl mb-2">{totalPowerUsage.toFixed(2)} W <span className="text-sm text-muted-foreground">(Avg: {(totalPowerUsage / nodes.length).toFixed(2)} W)</span></div>
          <div className="h-[80px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary)/.2)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Total Memory Usage</CardTitle>
        <FaMemory className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          <div className="text-2xl mb-2">
            {totalMemoryUsage.toFixed(1)} / {totalMemoryCapacity.toFixed(1)} GB
            <span className="text-sm text-muted-foreground ml-2">
              ({((totalMemoryUsage / totalMemoryCapacity) * 100).toFixed(1)}%)
            </span>
          </div>
          <div className="h-[80px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={memoryHistory.map(value => ({ value }))}>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary)/.2)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Average CPU Usage</CardTitle>
        <CpuIcon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          <div className="text-2xl mb-2">
            {averageCpuUsage.toFixed(1)}%
            <span className="text-sm text-muted-foreground ml-2">
              ({nodes.length} nodes)
            </span>
          </div>
          <div className="h-[80px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cpuHistory.map(value => ({ value }))}>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary)/.2)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full">
        {sortNodesWithMasterFirst(nodes).map(node => (
          <Card 
            key={node.id}
            className="hover:bg-accent/50 transition-colors"
            // style={{maxWidth: '100%', minWidth: '320px', width: '100%'}}
          >
            <CardHeader 
              className="cursor-pointer flex flex-row items-center justify-between space-y-0 pb-2"
              onClick={() => navigate(`/node/${node.id}`)}
            >
              <CardTitle className="text-lg font-medium">
                {node.name.length > 20 ? node.name.slice(0, 20) + '...' : node.name}
                {node.isMaster && <span className="ml-2 text-sm text-yellow-500 mr-2">(Master)</span>}
              </CardTitle>
              <Server className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="compute" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4 mt-4">
                  <TabsTrigger value="compute">Compute</TabsTrigger>
                  <TabsTrigger value="network">Network</TabsTrigger>
                </TabsList>
                
                <TabsContent value="compute" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CpuIcon className="h-4 w-4" />
                      <span>CPU</span>
                    </div>
                    <Progress value={node.data.cpuUsage} className="w-1/2" />
                    <span className="text-sm">{node.data.cpuUsage.toFixed(1)}%</span>
                  </div>

                  {isAppleSilicon(node.data.cpuModel) && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <BsGpuCard className="h-4 w-4" />
                        <span>GPU</span>
                      </div>
                      <Progress value={node.data.gpuUsage} className="w-1/2" />
                      <span className="text-sm">{node.data.gpuUsage.toFixed(1)}%</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FaMemory className="h-4 w-4" />
                      <span>RAM</span>
                    </div>
                    <Progress value={node.data.memoryUsage} className="w-1/2" />
                    <span className="text-sm">{node.data.memoryUsage.toFixed(1)}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <BsFillNvmeFill className="h-4 w-4" />
                      <span>Disk</span>
                    </div>
                    <Progress value={(node.data.storageInfo.used / node.data.storageInfo.total) * 100} className="w-1/2" />
                    <span className="text-sm">{((node.data.storageInfo.used / node.data.storageInfo.total) * 100).toFixed(1)}%</span>
                  </div>
                  {node.data.powerUsage && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                      <ZapIcon className="h-4 w-4" />
                      <span>Power Usage</span>
                    </div>
                    <div className="text-sm text-right">
                      <div className="text-muted-foreground">{node.data.powerUsage.toFixed(2)} W</div>
                      </div>
                    </div>
                  )}
                  {node.data.cpuCoreCount && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CpuIcon className="h-4 w-4" />
                        <span>CPU Cores</span>
                      </div>
                      <div className="text-sm text-right">
                        <div className="text-muted-foreground">{node.data.cpuCoreCount}</div>
                      </div>
                    </div>
                  )}
                  
                </TabsContent>

                <TabsContent value="network" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <NetworkIcon className="h-4 w-4" />
                      <span>Network</span>
                    </div>
                    <div className="text-sm text-right">
                      <div>↓ {formatBytes(node.data.networkTraffic.rx)}/s</div>
                      <div>↑ {formatBytes(node.data.networkTraffic.tx)}/s</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FaEthernet className="h-4 w-4" />
                      <span>Local IP</span>
                    </div>
                    <div className="text-sm text-right">
                      <div className="text-muted-foreground">{node.ip}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FaCloudflare className="h-4 w-4" />
                      <span>Cloudflared</span>
                    </div>
                    <div className="text-sm text-right">
                      {node.data.cloudflaredRunning ? (
                    <div className="text-green-500">
                      ● Running
                    </div>
                  ) : (
                    <div className="text-red-500">
                      ● Not Running
                    </div>
                  )}
                    </div>
                  </div>
                  
                </TabsContent>
              </Tabs>

              <div 
                className="absolute inset-0 z-10 cursor-pointer"
                onClick={() => navigate(`/node/${node.id}`)}
                style={{ 
                  pointerEvents: 'none',
                  // Enable pointer events only outside the tabs area
                  // This allows clicking the tabs while still making the rest of the card clickable
                }}
              />
            </CardContent>
          </Card>
        ))}
      </div>
      </div>
      </div>
    </>
  );
}

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}