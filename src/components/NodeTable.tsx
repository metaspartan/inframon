import { NodeStatus, NodeWithData } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "./ui/badge";
import { FaApple, FaLinux } from "react-icons/fa";
import { Progress } from "./ui/progress";
import { DropdownMenu, DropdownMenuSeparator, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Pencil1Icon, TrashIcon } from "@radix-ui/react-icons";
import { DotsVerticalIcon } from "@radix-ui/react-icons";
import { TerminalIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";


interface NodeTableProps {
  nodes: NodeWithData[];
  setSelectedNode: (node: NodeWithData | null) => void;
  setShowEditHostname: (show: boolean) => void;
  setShowDeleteConfirm: (show: boolean) => void;
}

export function NodeTable({ 
  nodes, 
  setSelectedNode, 
  setShowEditHostname, 
  setShowDeleteConfirm 
  }: NodeTableProps) {
  const navigate = useNavigate();
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>CPU</TableHead>
            <TableHead>Memory</TableHead>
            <TableHead>GPU</TableHead>
            <TableHead>Storage</TableHead>
            <TableHead>Power</TableHead>
            <TableHead>TFLOPS</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {nodes.map((node) => (
            <TableRow 
              key={node.id}
              className="cursor-pointer"
              onClick={() => navigate(`/node/${node.id}`)}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {node.os === 'macOS' && <FaApple className="h-4 w-4" />}
                  {node.os === 'Linux' && <FaLinux className="h-4 w-4" />}
                  {node.name}
                  {node.isMaster && <Badge variant="secondary" className="ml-2">M</Badge>}
                </div>
              </TableCell>
              {/* <TableCell>
                <Badge variant={node.status === NodeStatus.CONNECTED ? "default" : "destructive"}>
                  {node.ip}
                </Badge>
              </TableCell> */}
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={node.data.cpuUsage} className="w-[60px]" />
                  <span className="text-sm">{node.data.cpuUsage.toFixed(1)}%</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={node.data.memoryUsage} className="w-[60px]" />
                  <span className="text-sm">{node.data.memoryUsage.toFixed(1)}% ({node.data.usedMemory.toFixed(2)} / {node.data.totalMemory.toFixed(0)} GB)</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={node.data.gpuUsage} className="w-[60px]" />
                  <span className="text-sm">{node.data.gpuUsage.toFixed(1)}%</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={(node.data.storageInfo.used / node.data.storageInfo.total) * 100} 
                    className="w-[60px]" 
                  />
                  <span className="text-sm">
                    {((node.data.storageInfo.used / node.data.storageInfo.total) * 100).toFixed(1)}%
                  </span>
                </div>
              </TableCell>
              <TableCell>{node.data.powerUsage.toFixed(2)} W</TableCell>
              <TableCell>{node.data.deviceCapabilities.flops.fp16.toFixed(2)} TFLOPS</TableCell>
              <TableCell>
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}