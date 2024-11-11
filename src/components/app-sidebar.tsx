import { Gauge } from "lucide-react"
import { Link } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { ModeToggle } from '@/components/mode-toggle';
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { ServerNode } from "@/types";
import { FaApple, FaLinux } from "react-icons/fa";
import { Badge } from "@/components/ui/badge";
import { sortNodes } from "@/lib/sorting";
import { useSortContext } from "@/contexts/SortContext";
// Menu items.
const items = [
  {
    title: "Nodes Dashboard",
    url: "/",
    icon: Gauge,
  },
]

const sortNodesWithMasterFirst = (nodes: ServerNode[]) => {
    return [...nodes].sort((a, b) => {
      if (a.isMaster && !b.isMaster) return -1;
      if (!a.isMaster && b.isMaster) return 1;
      return 0;
    });
  };

export function AppSidebar({ nodes }: { nodes: ServerNode[] }) {
  const { sortBy, sortDirection, customOrder } = useSortContext();
  
  return (
    <Sidebar>
    <SidebarHeader>
    <header className="flex justify-between items-center bg-background dark:bg-background rounded-lg p-2">
              <Link to="/"><h2 className="text-2xl font-bold dark:text-white text-black ml-1 mb-1">⚡Inframon</h2></Link>
              <ModeToggle />
            </header>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          {/* <SidebarGroupLabel>Application</SidebarGroupLabel> */}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                  <Link to={item.url} className="dark:text-white text-black">
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
             <SidebarSeparator />
              <SidebarGroupLabel>{nodes.length} Nodes</SidebarGroupLabel>
              {nodes.length > 0 && (
                <>
                    {sortNodes(nodes, sortBy, sortDirection, customOrder).map((node) => (
                    <SidebarMenuItem key={node.id}>
                      <SidebarMenuButton asChild>
                        <Link to={`/node/${node.id}`} className="dark:text-white text-black w-full">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center">
                              {node.os === 'macOS' && <FaApple className="h-4 w-4 mr-2" />}
                              {node.os === 'Linux' && <FaLinux className="h-4 w-4 mr-2" />}
                              <span style={{fontSize: '13px'}}>{node.name.length > 20 ? node.name.slice(0, 20) + '...' : node.name}</span>
                            </div>
                            {node.isMaster && <Badge variant="secondary" className="text-yellow-500">M</Badge>}
                          </div>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </>
                )}

              <SidebarSeparator />
              <SidebarGroupLabel>Install or Contribute</SidebarGroupLabel>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <a href="https://github.com/metaspartan/inframon" className="dark:text-white text-black" target="_blank" rel="noopener noreferrer">
                    <GitHubLogoIcon />
                    <span>Github</span>
                    </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <p className="text-sm text-muted-foreground mx-auto">Version v0.1.3</p>
        <a href="https://x.com/carsenklock" className="dark:text-white text-black mx-auto mb-4 " target="_blank" rel="noopener noreferrer">🔨 Built by Carsen Klock</a>
      </SidebarFooter>
    </Sidebar>
  )
}
