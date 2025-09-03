import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Bot, Inbox, BarChart3, AlertTriangle, CheckCircle, Settings, RefreshCw } from "lucide-react";

interface SidebarProps {
  activeView: "inbox" | "analytics" | "urgent" | "processed" | "settings";
  onViewChange: (view: "inbox" | "analytics" | "urgent" | "processed" | "settings") => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: emails = [] } = useQuery({
    queryKey: ["/api/emails"],
  });

  const { data: urgentEmails = [] } = useQuery({
    queryKey: ["/api/emails", "urgent"],
    queryFn: async () => {
      const res = await fetch("/api/emails?urgency=urgent");
      if (!res.ok) throw new Error("Failed to fetch urgent emails");
      return res.json();
    },
  });

  const syncEmailsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/emails/sync");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      toast({
        title: "Emails Synced",
        description: data.message,
      });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Failed to sync emails",
        variant: "destructive",
      });
    },
  });

  const navItems = [
    {
      id: "inbox" as const,
      label: "Inbox",
      icon: Inbox,
      count: emails.length,
    },
    {
      id: "analytics" as const,
      label: "Analytics",
      icon: BarChart3,
    },
    {
      id: "urgent" as const,
      label: "Urgent",
      icon: AlertTriangle,
      count: urgentEmails.length,
      variant: "destructive" as const,
    },
    {
      id: "processed" as const,
      label: "Processed",
      icon: CheckCircle,
    },
    {
      id: "settings" as const,
      label: "Settings",
      icon: Settings,
    },
  ];

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="font-semibold text-lg">AI Assistant</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => onViewChange(item.id)}
                data-testid={`nav-${item.id}`}
              >
                <Icon className="w-4 h-4 mr-3" />
                <span>{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <Badge 
                    variant={item.variant || "secondary"} 
                    className="ml-auto"
                    data-testid={`badge-${item.id}`}
                  >
                    {item.count}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>

        <div className="mt-6">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => syncEmailsMutation.mutate()}
            disabled={syncEmailsMutation.isPending}
            data-testid="button-sync-emails"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncEmailsMutation.isPending ? 'animate-spin' : ''}`} />
            {syncEmailsMutation.isPending ? "Syncing..." : "Sync Emails"}
          </Button>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <span className="text-muted-foreground text-sm">ST</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Support Team</p>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
        </div>
      </div>
    </div>
  );
}
