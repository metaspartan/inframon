import { NodeWithData, SortDirection, NodeStatus } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { Progress } from './ui/progress';
import { ArrowDownIcon, ArrowUpIcon, CpuIcon, NetworkIcon, TerminalIcon, ZapIcon } from 'lucide-react';
import { BsGpuCard, BsFillNvmeFill } from "react-icons/bs";
import { FaMemory, FaEthernet, FaCloudflare, FaApple, FaLinux } from "react-icons/fa";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { useState, useEffect } from "react";
import { SortOption, SortPreferences, OSFilter, NodeTypeFilter } from "@/types";
import { useSortContext } from '@/contexts/SortContext';
import { sortNodes } from '@/lib/sorting';
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { VscChip } from "react-icons/vsc";
import { DotsVerticalIcon, Pencil1Icon, TrashIcon } from '@radix-ui/react-icons';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GpuBar } from './GpuBar';

const SORT_PREFERENCES_KEY = "nodeList:sortPreferences";

export function NodeList({ nodes }: { nodes: NodeWithData[] }) {
  const navigate = useNavigate();
  const isAppleSilicon = (cpuModel: string) => cpuModel.toLowerCase().includes('apple');

  const { sortBy, setSortBy, sortDirection, setSortDirection, customOrder, setCustomOrder, osFilter, setOSFilter, nodeTypeFilter, setNodeTypeFilter } = useSortContext();
  const [searchTerm, setSearchTerm] = useState("");

  const [showEditHostname, setShowEditHostname] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newHostname, setNewHostname] = useState("");
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [selectedNode, setSelectedNode] = useState<NodeWithData | null>(null);
  const [showStats, setShowStats] = useState(true);

  // Load preferences from localStorage
  useEffect(() => {
    const savedPreferences = localStorage.getItem(SORT_PREFERENCES_KEY);
    if (savedPreferences) {
      const { sortBy: savedSortBy, direction, order, osFilter: savedOSFilter, nodeTypeFilter: savedNodeTypeFilter } = 
        JSON.parse(savedPreferences) as SortPreferences;
      setSortBy(savedSortBy);
      setSortDirection(direction);
      setCustomOrder(order);
      setOSFilter(savedOSFilter);
      setNodeTypeFilter(savedNodeTypeFilter);
    }
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    const preferences: SortPreferences = {
      sortBy,
      direction: sortDirection,
      order: customOrder,
      osFilter,
      nodeTypeFilter
    };
    localStorage.setItem(SORT_PREFERENCES_KEY, JSON.stringify(preferences));
  }, [sortBy, sortDirection, customOrder, osFilter, nodeTypeFilter]);

  
  useEffect(() => {
    if (sortBy !== "master") {
      setCustomOrder([]);
    }
  }, [sortBy]);

  if (!nodes.length) {
    return (
      <div className="container mx-auto p-4">
        <p className="text-center text-muted-foreground">No nodes found...</p>
      </div>
    );
  }

  const updateHostname = async (nodeId: string, newHostname: string) => {
    try {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) {
        console.error('Node not found');
        return;
      }
  
      const hostname = window.location.hostname;
      const response = await fetch(`http://${hostname}:3899/api/nodes/${nodeId}/hostname`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hostname: newHostname }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to update hostname');
      }
  
      // Close dialogs
      setShowEditHostname(false);
      setShowSaveConfirm(false);
      
      // Clear the input
      setNewHostname('');
    } catch (error) {
      console.error('Error updating hostname:', error);
    }
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

  const filteredAndSortedNodes = sortNodes(nodes, sortBy, sortDirection, customOrder).filter((node) => {
    const matchesSearch = searchTerm 
      ? node.name.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
  
    const matchesOS = osFilter === "all" 
      ? true 
      : osFilter === "macos" 
        ? node.os === "macOS"
        : node.os === "Linux";
  
    const matchesType = nodeTypeFilter === "all"
      ? true
      : nodeTypeFilter === "master"
        ? node.isMaster
        : !node.isMaster;
  
    return matchesSearch && matchesOS && matchesType;
  });

  const removeNode = async (nodeId: string) => {
    try {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) {
        console.error('Node not found');
        return;
      }
  
      const hostname = window.location.hostname;
      const response = await fetch(`http://${hostname}:3899/api/nodes/${nodeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
  
      if (!response.ok) {
        throw new Error('Failed to remove node');
      }
  
      // Close any open dialogs
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error removing node:', error);
    }
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
  
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
  
    const items = Array.from(filteredAndSortedNodes);
    const [reorderedItem] = items.splice(sourceIndex, 1);
    items.splice(destinationIndex, 0, reorderedItem);
  
    // Update the custom order with all node IDs in their new positions
    const newOrder = items.map(node => node.id);
    setCustomOrder(newOrder);
    
    // Don't reset sort options when dragging
    if (sortBy !== "master") {
      setSortBy("master");
      setSortDirection("asc");
    }
  };

  function getTimeSinceLastHeartbeat(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 10) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  }

  const totalTFLOPS = nodes.reduce((acc, node) => {
    const flops = node.data?.deviceCapabilities?.flops?.fp16 || 0;
    return acc + flops;
  }, 0);

  return (
    <>
      <div className="w-full max-w-full mt-2">
        <div className="mb-4">          
          <div className="flex gap-4 mb-4 items-center justify-between flex-wrap">
          <div className="flex gap-4 items-center">
            <Input
              placeholder="Search nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by">
                  {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="master">Master First</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="cpu">CPU Usage</SelectItem>
                <SelectItem value="gpu">GPU Usage</SelectItem>
                <SelectItem value="memory">Memory Usage</SelectItem>
                <SelectItem value="power">Power Usage</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
              variant="outline"
              size="icon"
              className="px-3 py-2"
            >
              {sortDirection === "asc" ? <><ArrowUpIcon className="h-4 w-4" /></> : <><ArrowDownIcon className="h-4 w-4" /></>}
            </Button>
          </div>

          <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <Switch
              checked={showStats}
              onCheckedChange={setShowStats}
              id="stats-mode"
            />
            <label htmlFor="stats-mode" className="text-sm text-muted-foreground">
              Totals
            </label>
          </div>
          <Select value={osFilter} onValueChange={(value: OSFilter) => setOSFilter(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="OS Type">
                {osFilter === 'all' ? 'All OS' : osFilter === 'macos' ? 'macOS' : 'Linux'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All OS</SelectItem>
              <SelectItem value="macos">macOS</SelectItem>
              <SelectItem value="linux">Linux</SelectItem>
            </SelectContent>
          </Select>

          <Select value={nodeTypeFilter} onValueChange={(value: NodeTypeFilter) => setNodeTypeFilter(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Node Type">
                {nodeTypeFilter === 'all' ? 'All Nodes' : nodeTypeFilter === 'master' ? 'Master Only' : 'Workers Only'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Nodes</SelectItem>
              <SelectItem value="master">Master Only</SelectItem>
              <SelectItem value="worker">Nodes Only</SelectItem>
            </SelectContent>
          </Select>
          
        </div>
        </div>
        <div className={cn(
              "grid gap-4 sm:grid-cols-1 lg:grid-cols-3 max-w-full w-full min-w-full transition-all duration-300",
              showStats ? "opacity-100 max-h-[100%] mb-4" : "opacity-0 max-h-0 overflow-hidden"
            )}>
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
          {/* <div className={cn(
              "transition-all duration-300",
              showStats ? "opacity-100 max-h-[100%] mb-4" : "opacity-0 max-h-0 overflow-hidden"
            )}>
            {totalTFLOPS && (
              <Card className="pt-6">
                <CardContent>
                <GpuBar flops={totalTFLOPS} />
                </CardContent>
              </Card>
            )}
          </div> */}
          <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="nodes" direction="horizontal">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full"
                style={{
                  display: 'grid',
                  gridAutoFlow: 'row dense'
                }}
              >
                {filteredAndSortedNodes.map((node, index) => (
                  <Draggable key={node.id} draggableId={node.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          ...provided.draggableProps.style,
                          gridColumn: snapshot.isDragging ? 'span 1' : 'auto',
                          transition: snapshot.isDragging ? 'none' : 'transform 0.2s',
                          zIndex: snapshot.isDragging ? 1000 : 1,
                        }}
                        className="h-full"
                      >
                          <Card className="hover:bg-accent/50 transition-colors">
                            <CardHeader 
                              className="cursor-pointer flex flex-row items-center justify-between space-y-0 pb-2"
                              // onClick={() => navigate(`/node/${node.id}`)}
                            >
                              <CardTitle 
                                className="flex flex-row text-lg font-medium cursor-pointer items-center justify-between" 
                                onClick={() => navigate(`/node/${node.id}`)}>
                                {node.os === 'macOS' && <FaApple className="h-5 w-5 text-muted-foreground mr-2" />}
                                {node.os === 'Linux' && <FaLinux className="h-5 w-5 text-muted-foreground mr-2" />}
                                {node.name.length > 20 ? node.name.slice(0, 20) + '...' : node.name}
                                {node.isMaster && <Badge variant="secondary" className="ml-2 text-yellow-500 mr-2">M</Badge>}
                              </CardTitle>
                              
                              {/* Small settings button with dots */}
                              <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                                  <DotsVerticalIcon className="h-4 w-2" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                  setSelectedNode(node);
                                  setShowEditHostname(true);
                                }}>
                                  <Pencil1Icon className="mr-2 h-4 w-4" />
                                  Edit Hostname
                                </DropdownMenuItem>
                                <DropdownMenuItem disabled>
                                  <TerminalIcon className="mr-2 h-4 w-4" />
                                  Terminal
                                </DropdownMenuItem>                                
                                {!node.isMaster && (<>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => {
                                    setSelectedNode(node);
                                    setShowDeleteConfirm(true);
                                  }} className="text-red-600">
                                  <TrashIcon className="mr-2 h-4 w-4" />
                                  Remove Node
                                </DropdownMenuItem>
                                </>)}
                              </DropdownMenuContent>
                            </DropdownMenu>
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

                                  {/* {isAppleSilicon(node.data.cpuModel) && ( */}
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <BsGpuCard className="h-4 w-4" />
                                        <span>GPU</span>
                                      </div>
                                      <Progress value={node.data.gpuUsage} className="w-1/2" />
                                      <span className="text-sm">{node.data.gpuUsage.toFixed(1)}%</span>
                                    </div>
                                  

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

                                  {node.data.powerUsage > 0 && (
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
                                      <span>{isAppleSilicon(node.data.cpuModel) ? 'CPU/GPU Cores' : 'CPU Cores'}</span>
                                    </div>
                                    <div className="text-sm text-right">
                                      <div className="text-muted-foreground">
                                        {isAppleSilicon(node.data.cpuModel) 
                                          ? `${node.data.cpuCoreCount}/${node.data.gpuCoreCount}`
                                          : node.data.cpuCoreCount
                                        }
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {node.data.deviceCapabilities && (
                                  <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <VscChip className="h-4 w-4" />
                                    <span>TFLOPS</span>
                                  </div>
                                  <div className="text-sm text-right">
                                    <div className="text-muted-foreground">
                                      {node.data.deviceCapabilities.flops.fp16.toFixed(2)}
                                    </div>
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
                                        <div className="text-green-500">● Running</div>
                                      ) : (
                                        <div className="text-red-500">● Not Running</div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                <Badge variant={
                                  node.status === NodeStatus.CONNECTED ? "default" :
                                  node.status === NodeStatus.CONNECTING ? "destructive" : "destructive"
                                }>
                                  {node.status}
                                </Badge></div>
                                <div className="text-sm text-right">
                                  Last seen: {getTimeSinceLastHeartbeat(node.lastSeen)}                                  
                                </div>
                              </div>
                                </TabsContent>
                              </Tabs>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>
<AlertDialog open={showEditHostname} onOpenChange={setShowEditHostname}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Edit Hostname</AlertDialogTitle>
      <AlertDialogDescription>
        Enter a new hostname for this node.<br />
        Current hostname: <strong>{selectedNode?.name}</strong>
      </AlertDialogDescription>
    </AlertDialogHeader>
    <div className="py-4">
      <Input
        value={newHostname}
        onChange={(e) => setNewHostname(e.target.value)}
        placeholder="Enter new hostname..."
        className="w-full"
      />
    </div>
    <AlertDialogFooter>
      <AlertDialogCancel onClick={() => {
        setNewHostname("");
        setShowEditHostname(false);
      }}>
        Cancel
      </AlertDialogCancel>
      <AlertDialogAction onClick={() => {
        if (newHostname) {
          setShowSaveConfirm(true);
        }
      }}>
        Save Changes
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

{/* Save Confirmation Dialog */}
<AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Confirm Changes</AlertDialogTitle>
      <AlertDialogDescription>
        Are you sure you want to change the hostname to "{newHostname}"? This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel onClick={() => setShowSaveConfirm(false)}>
        Cancel
      </AlertDialogCancel>
      <AlertDialogAction onClick={() => {
        if (selectedNode && newHostname) {
          updateHostname(selectedNode.id, newHostname);
          setShowSaveConfirm(false);
          setShowEditHostname(false);
          setNewHostname("");
          setSelectedNode(null);
        }
      }}>
        Yes, Change Hostname
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

{/* Delete Confirmation Dialog */}
<AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Remove Node</AlertDialogTitle>
      <AlertDialogDescription>
        Are you sure you want to remove this node? This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>
        Cancel
      </AlertDialogCancel>
      <AlertDialogAction onClick={() => {
        console.log('Removing node...');
        if (selectedNode) {
          removeNode(selectedNode.id);
        }
        setShowDeleteConfirm(false);
      }} className="bg-red-600 hover:bg-red-700">
        Yes, Remove Node
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
    </>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}