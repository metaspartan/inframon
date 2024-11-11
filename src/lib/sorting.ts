import { NodeWithData, ServerNode } from '@/types';

export const sortNodes = <T extends ServerNode | NodeWithData>(
  nodes: T[],
  sortBy: string,
  sortDirection: 'asc' | 'desc',
  customOrder: string[]
) => {
  return [...nodes].sort((a, b) => {
    if (customOrder.length > 0) {
      const indexA = customOrder.indexOf(a.id);
      const indexB = customOrder.indexOf(b.id);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    }

    const direction = sortDirection === "asc" ? 1 : -1;
    
    switch (sortBy) {
      case "master":
        return a.isMaster === b.isMaster ? 0 : a.isMaster ? -direction : direction;
      case "name":
        return direction * a.name.localeCompare(b.name);
      case "cpu":
        return direction * ((a as NodeWithData).data?.cpuUsage - (b as NodeWithData).data?.cpuUsage);
      case "gpu":
        return direction * ((a as NodeWithData).data?.gpuUsage - (b as NodeWithData).data?.gpuUsage);
      case "memory":
        return direction * ((a as NodeWithData).data?.memoryUsage - (b as NodeWithData).data?.memoryUsage);
      case "power":
        return direction * ((a as NodeWithData).data?.powerUsage - (b as NodeWithData).data?.powerUsage);
      default:
        return 0;
    }
  });
};