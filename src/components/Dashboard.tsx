import { ServerData } from '@/types';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CpuIcon, HardDriveIcon, ZapIcon, WifiIcon, ServerIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import { Chart } from '@/components/ui/chart';
import { Button } from '@/components/ui/button';

interface DashboardProps {
  data: ServerData;
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [isIpBlurred, setIsIpBlurred] = useState(true);

  const toggleIpBlur = () => {
    setIsIpBlurred(!isIpBlurred);
  };
  return (<>
  <div className="w-full max-w-full">
  <div className="mb-4">
    <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
       <CardTitle className="text-sm font-medium text-muted-foreground">System Status ({data.uptime})</CardTitle>
       </CardHeader>
       <CardContent>
       <strong>{data.systemName}</strong> with <strong>{data.cpuModel}</strong>
       </CardContent>
    </Card>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-full">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
          <CpuIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.cpuUsage}%</div>
          <Progress value={data.cpuUsage} className="mt-2" />
        </CardContent>
      </Card>

      <Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">Memory</CardTitle>
    <HardDriveIcon className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">{data.usedMemory.toFixed(2)}/{data.totalMemory.toFixed(2)} GB</div>
    <Progress value={data.memoryUsage} className="mt-2" />
  </CardContent>
</Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Power Usage</CardTitle>
          <ZapIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.powerUsage} W</div>
          <div className="text-sm text-muted-foreground">Average over time: {(data.powerHistory.reduce((a, b) => a + b, 0) / data.powerHistory.length).toFixed(3)} W</div>
        </CardContent>
      </Card>

<Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">CPU Cores</CardTitle>
    <CpuIcon className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">{data.cpuCoreCount}</div>
  </CardContent>
</Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Local IP</CardTitle>
          <ServerIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
        <div className="flex items-center justify-between">
            <div className={`text-2xl font-bold ${isIpBlurred ? 'blur-md' : ''}`}>
              {data.localIp}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleIpBlur}
              aria-label={isIpBlurred ? 'Show IP' : 'Hide IP'}
              className="outline-none focus:outline-none"
            >
              {isIpBlurred ? (
                <div className="flex items-center justify-between">
                  <EyeIcon className="h-4 w-4 text-white" />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <EyeOffIcon className="h-4 w-4 text-white" />
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cloudflared Status</CardTitle>
          <ServerIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.cloudflaredRunning ? '🟢 Running' : '🔴 Stopped'}</div>
        </CardContent>
      </Card>

      {/* <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Network Traffic</CardTitle>
          <WifiIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            Rx: {data.networkTraffic.rx.toFixed(2)} B/s
            <br />
            Tx: {data.networkTraffic.tx.toFixed(2)} B/s
          </div>
        </CardContent>
      </Card> */}

      <div className="col-span-full grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Chart 
          data={data.cpuHistory} 
          timePoints={data.timePoints} 
          title="CPU Usage"
          color="hsl(var(--chart-1))"
          unit="%"
        />
        <Chart 
          data={data.memoryHistory} 
          timePoints={data.timePoints} 
          title="Memory Usage"
          color="hsl(var(--chart-2))"
          unit="%"
        />
        {/* <Chart 
          data={data.powerHistory} 
          timePoints={data.timePoints} 
          title="Power Usage"
          color="hsl(var(--chart-3))"
          unit="W"
        /> */}
        {/* <Chart 
          data={data.networkRxHistory} 
          timePoints={data.timePoints} 
          title="Network Rx"
          color="hsl(var(--chart-4))"
          unit="B/s"
        />
        <Chart 
          data={data.networkTxHistory} 
          timePoints={data.timePoints} 
          title="Network Tx"
          color="hsl(var(--chart-5))"
          unit="B/s"
        /> */}
      </div>
      <div className="grid col-span-full grid-cols-1 lg:grid-cols-1">
      <Chart 
          data={data.powerHistory} 
          timePoints={data.timePoints} 
          title="Power Usage"
          color="hsl(var(--chart-3))"
          unit="W"
        />
      </div>
    </div>
  </div></>);
};

export default Dashboard;