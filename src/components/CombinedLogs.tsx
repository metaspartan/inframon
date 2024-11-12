import React from 'react';
import { ScrollArea } from "./ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { NodeWithData } from '@/types';
import { Badge } from './ui/badge';

interface CombinedLogsProps {
  nodes: NodeWithData[];
}

export function CombinedLogs({ nodes }: CombinedLogsProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Combined Node Logs</CardTitle>
        <CardDescription>View all Inframon logs from all nodes in one place</CardDescription>
      </CardHeader>
      <CardContent>
          {nodes.map((node) => (
            <div key={node.id} className="mb-6">
              <h3 className="text-lg font-semibold mb-2">
                {node.name} {node.isMaster ? <Badge variant="outline">Master</Badge> : <Badge variant="outline">Node</Badge>} <Badge variant="secondary">{node.ip}</Badge>
              </h3>
              <pre className="text-sm font-mono whitespace-pre-wrap bg-muted p-2 rounded">
                {node.data.logs || 'No logs available'}
              </pre>
            </div>
          ))}
      </CardContent>
    </Card>
  );
}