import { Gauge, ServerIcon } from "lucide-react"

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
  return (
    <Sidebar>
    <SidebarHeader>
    <header className="flex justify-between items-center">
              <a href="/"><h2 className="text-2xl font-bold dark:text-white text-black ml-1">Infra⚡Mon</h2></a>
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
                    <a href={item.url} className="dark:text-white text-black">
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
             <SidebarSeparator />
              <SidebarGroupLabel>Nodes</SidebarGroupLabel>
              {nodes.length > 0 && (
                <>
                    {sortNodesWithMasterFirst(nodes).map((node) => (
                    <SidebarMenuItem key={node.id}>
                        <SidebarMenuButton asChild>
                        <a href={`/node/${node.id}`} className="dark:text-white text-black">
                            <ServerIcon className="h-4 w-4 mr-2" />
                            <span style={{fontSize: '13px'}}>{node.name}</span>
                            {node.isMaster && <span className="ml-2 text-xs text-yellow-500">(Master)</span>}
                        </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    ))}
                </>
                )}

              <SidebarSeparator />
              <SidebarGroupLabel>Download or Contribute</SidebarGroupLabel>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <a href="https://github.com/metaspartan/servermon" className="dark:text-white text-black" target="_blank" rel="noopener noreferrer">
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
        <p className="text-sm text-muted-foreground mx-auto">Version v0.1.0</p>
        <a href="https://github.com/metaspartan/servermon" className="hover:underline dark:text-white text-black mx-auto mb-4" target="_blank" rel="noopener noreferrer">Built by Carsen Klock</a>
      </SidebarFooter>
    </Sidebar>
  )
}
