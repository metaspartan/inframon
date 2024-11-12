import React, { useState, useRef, useEffect } from 'react';
import { ScrollArea } from "./ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { NodeWithData } from '@/types';
import { Badge } from './ui/badge';

interface CombinedLogsProps {
  nodes: NodeWithData[];
}

export function CombinedLogs({ nodes }: CombinedLogsProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string>(nodes[0]?.id || '');
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedNode = nodes.find(node => node.id === selectedNodeId);

  // Auto scroll to bottom when logs update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedNode?.data.logs]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Node Logs</CardTitle>
        <CardDescription>View Inframon logs for each node</CardDescription>
        <Select value={selectedNodeId} onValueChange={setSelectedNodeId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a node" />
          </SelectTrigger>
          <SelectContent>
            {nodes.map((node) => (
              <SelectItem key={node.id} value={node.id}>
                {node.name} {node.isMaster ? '(Master)' : '(Node)'} - {node.ip}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {selectedNode && (
          <div>
            <h3 className="text-lg font-semibold mb-2">
              {selectedNode.name} {' '}
              {selectedNode.isMaster ? 
                <Badge variant="outline">Master</Badge> : 
                <Badge variant="outline">Node</Badge>
              } {' '}
              <Badge variant="secondary">{selectedNode.ip}</Badge>
            </h3>
            <ScrollArea className="h-[400px] w-full rounded-md border">
              <div ref={scrollRef} className="p-4">
                <pre className="text-sm font-mono whitespace-pre-wrap dark:text-green-500">
                  {selectedNode.data.logs || 'No logs available'}
                </pre>
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}