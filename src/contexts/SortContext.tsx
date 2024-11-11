import { createContext, useState, useContext, ReactNode } from 'react';
import { SortOption, SortDirection, OSFilter, NodeTypeFilter } from '@/types';

interface SortContextType {
  sortBy: SortOption;
  setSortBy: (option: SortOption) => void;
  sortDirection: SortDirection;
  setSortDirection: (direction: SortDirection) => void;
  customOrder: string[];
  setCustomOrder: (order: string[]) => void;
  osFilter: OSFilter;
  setOSFilter: (filter: OSFilter) => void;
  nodeTypeFilter: NodeTypeFilter;
  setNodeTypeFilter: (filter: NodeTypeFilter) => void;
}

const SortContext = createContext<SortContextType | undefined>(undefined);

export function SortProvider({ children }: { children: ReactNode }) {
  const [sortBy, setSortBy] = useState<SortOption>("master");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [customOrder, setCustomOrder] = useState<string[]>([]);
  const [osFilter, setOSFilter] = useState<OSFilter>("all");
  const [nodeTypeFilter, setNodeTypeFilter] = useState<NodeTypeFilter>("all");

  return (
    <SortContext.Provider value={{
      sortBy,
      setSortBy,
      sortDirection,
      setSortDirection,
      customOrder,
      setCustomOrder,
      osFilter,
      setOSFilter,
      nodeTypeFilter,
      setNodeTypeFilter
    }}>
      {children}
    </SortContext.Provider>
  );
}

export const useSortContext = () => {
  const context = useContext(SortContext);
  if (!context) throw new Error('useSortContext must be used within a SortProvider');
  return context;
};