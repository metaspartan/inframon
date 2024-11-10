// src/contexts/NodesContext.tsx
import { createContext, useContext } from 'react';
import { NodeWithData } from '@/types';

export const NodesContext = createContext<[NodeWithData[], (nodes: NodeWithData[]) => void]>([[], () => {}]);

export const useNodesContext = () => useContext(NodesContext);