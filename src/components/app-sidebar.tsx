import { DownloadIcon, Gauge, ScrollText, CopyIcon, CheckIcon  } from "lucide-react"
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Link } from 'react-router-dom';
import { useState } from "react";
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
import { Button } from "@/components/ui/button";
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
  {
    title: "Combined Logs",
    url: "/logs",
    icon: ScrollText, // Import this from lucide-react
  },
]

// const sortNodesWithMasterFirst = (nodes: ServerNode[]) => {
//     return [...nodes].sort((a, b) => {
//       if (a.isMaster && !b.isMaster) return -1;
//       if (!a.isMaster && b.isMaster) return 1;
//       return 0;
//     });
//   };

  const InstallGuide = () => {
    const [showDialog, setShowDialog] = useState(false);
    const [copied, setCopied] = useState(false);
    
    const installCommand = `curl -fsSL https://raw.githubusercontent.com/metaspartan/inframon/refs/heads/main/install.sh -o inframon-install.sh
chmod +x inframon-install.sh
sudo ./inframon-install.sh`;
    
    const handleCopy = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
  
    return (
      <>
        <SidebarMenuItem>
          <SidebarMenuButton asChild onClick={() => setShowDialog(true)}>
            <a className="dark:text-white text-black cursor-pointer" rel="noopener noreferrer">
              <DownloadIcon />
              <span>Install Guide</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
  
        <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Install Inframon</AlertDialogTitle>
              <AlertDialogDescription>
                <p className="mb-4">Run the following command to install or update Inframon:</p>
                <div className="relative">
                  <pre className="bg-black p-4 rounded-lg overflow-x-auto whitespace-pre-wrap break-all">
                    <code className="text-sm">{installCommand}</code>
                  </pre>
                  <CopyToClipboard text={installCommand} onCopy={handleCopy}>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-2 bottom-2"
                  >
                    {copied ? (
                      <CheckIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <CopyIcon className="h-4 w-4" />
                    )}
                  </Button>
                </CopyToClipboard>
                </div>
                <p className="mt-4 text-sm text-muted-foreground text-center">
                  This will download and run the install script. The script will:
                  
                    <p className="text-center">Install required dependencies</p>
                    <p className="text-center">Set up Inframon as master or node</p>
                    <p className="text-center">Configure it as a system service</p>
                  
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  };

export function AppSidebar({ nodes }: { nodes: ServerNode[] }) {
  const { sortBy, sortDirection, customOrder } = useSortContext();
  
  return (<>
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
              <SidebarGroupLabel>Links</SidebarGroupLabel>
              <InstallGuide />
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
     </>
  )
}
