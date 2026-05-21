import React, { useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Map, Pickaxe, ScrollText, ImagePlay } from "lucide-react";
import { useScrapeStore } from "@/stores/scrape.store";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/accounts", label: "Accounts", icon: Users },
  { path: "/regions", label: "Regions", icon: Map },
  { path: "/content", label: "Content", icon: ImagePlay },
  { path: "/logs", label: "Logs", icon: ScrollText },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isScraping = useScrapeStore((s) => s.isScraping);
  const { setScrapeState, appendLog, dispatchContentProcessed } = useScrapeStore();

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${protocol}://${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => setScrapeState({ connected: true });

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data as string);
        if (msg.type === "state") {
          setScrapeState({
            isScraping: msg.isScraping,
            isPaused: msg.isPaused ?? false,
            sessionId: msg.sessionId,
          });
        } else if (msg.type === "log") {
          appendLog(msg.entry);
        } else if (msg.type === "content_processed") {
          dispatchContentProcessed({
            contentId: msg.contentId,
            remoteUrl: msg.remoteUrl ?? null,
            skipReason: msg.skipReason,
            error: msg.error,
          });
        }
      } catch {}
    };

    ws.onclose = () => {
      setScrapeState({ connected: false });
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => ws.close();
  }, [setScrapeState, appendLog, dispatchContentProcessed]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current!);
      wsRef.current?.close();
    };
  }, [connect]);

  function isActive(path: string) {
    return path === "/" ? pathname === "/" : pathname.startsWith(path);
  }

  const currentPage = NAV_ITEMS.find((item) => isActive(item.path));

  return (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar collapsible="icon" variant="inset">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-2 py-1">
              <Pickaxe className="shrink-0" />
              <div className="grid flex-1 text-left text-xs leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold text-sidebar-foreground">
                  Instagram Scraper
                </span>
                <span className="truncate text-[10px] text-sidebar-foreground/60">
                  Job Content Manager
                </span>
              </div>
            </div>
          </SidebarHeader>
          <Separator className="bg-sidebar-border" />
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {NAV_ITEMS.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        onClick={() => navigate(item.path)}
                        isActive={isActive(item.path)}
                        tooltip={item.label}
                        aria-current={isActive(item.path) ? "page" : undefined}
                      >
                        <div className="relative">
                          <item.icon />
                          {item.path === "/logs" && isScraping && (
                            <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-green-500 animate-pulse" />
                          )}
                        </div>
                        <span>{item.label}</span>
                        {item.path === "/logs" && isScraping && (
                          <span className="ml-auto size-1.5 rounded-full bg-green-500 animate-pulse group-data-[collapsible=icon]:hidden" />
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
            <SidebarTrigger className="-ml-1" />
            {currentPage && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <span className="text-sm text-muted-foreground">{currentPage.label}</span>
              </>
            )}
          </header>
          <div className="flex-1 overflow-auto p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
