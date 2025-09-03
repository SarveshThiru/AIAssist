import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Mail, Download, Activity } from "lucide-react";
import type { QueueStats } from "@/lib/types";

export function EmailSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [emailType, setEmailType] = useState<string>("gmail");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  // Fetch queue statistics
  const { data: queueStats } = useQuery<QueueStats>({
    queryKey: ["/api/queue/stats"],
    refetchInterval: 5000, // Update every 5 seconds
  });

  const ingestEmailsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/emails/ingest", {
        emailType,
        email,
        password
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      toast({
        title: "Email Ingestion Complete",
        description: data.message,
      });
      // Clear sensitive data
      setPassword("");
    },
    onError: (error: any) => {
      toast({
        title: "Ingestion Failed",
        description: error.message || "Failed to ingest emails",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="flex-1 flex flex-col p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Email Configuration</h1>
        <p className="text-muted-foreground mt-1">Configure email ingestion and monitor processing queues</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Configuration */}
        <Card data-testid="card-email-config">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Account Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email-type">Email Provider</Label>
              <Select value={emailType} onValueChange={setEmailType}>
                <SelectTrigger data-testid="select-email-type">
                  <SelectValue placeholder="Select email provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gmail">Gmail</SelectItem>
                  <SelectItem value="outlook">Outlook/Office 365</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your-email@gmail.com"
                data-testid="input-email"
              />
            </div>

            <div>
              <Label htmlFor="password">
                {emailType === "gmail" ? "App Password" : "Password"}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={emailType === "gmail" ? "16-character app password" : "Your email password"}
                data-testid="input-password"
              />
              {emailType === "gmail" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Use an App Password, not your regular password. 
                  <a href="https://support.google.com/accounts/answer/185833" target="_blank" className="text-blue-500 hover:underline ml-1">
                    Learn how to create one →
                  </a>
                </p>
              )}
            </div>

            <Button
              onClick={() => ingestEmailsMutation.mutate()}
              disabled={!email || !password || ingestEmailsMutation.isPending}
              className="w-full"
              data-testid="button-ingest-emails"
            >
              <Download className="w-4 h-4 mr-2" />
              {ingestEmailsMutation.isPending ? "Connecting..." : "Import Support Emails"}
            </Button>

            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg text-xs text-blue-600 dark:text-blue-400">
              <strong>Demo Mode:</strong> Only emails with keywords like "Support", "Help", "Request", or "Query" will be imported and processed.
            </div>
          </CardContent>
        </Card>

        {/* Queue Statistics */}
        <Card data-testid="card-queue-stats">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Processing Queue Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {queueStats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-red-600" data-testid="queue-urgent-waiting">
                      {queueStats.urgent.waiting}
                    </div>
                    <p className="text-sm text-muted-foreground">Urgent Queue</p>
                    {queueStats.urgent.active > 0 && (
                      <Badge variant="destructive" className="mt-1">
                        Processing
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600" data-testid="queue-normal-waiting">
                      {queueStats.normal.waiting}
                    </div>
                    <p className="text-sm text-muted-foreground">Normal Queue</p>
                    {queueStats.normal.active > 0 && (
                      <Badge variant="secondary" className="mt-1">
                        Processing
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-2">Total Items in Queue</div>
                  <div className="text-lg font-semibold" data-testid="queue-total">
                    {queueStats.total.waiting + queueStats.total.active}
                  </div>
                  {queueStats.total.active > 0 && (
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-600">Processing</span>
                    </div>
                  )}
                </div>

                <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg text-xs text-green-600 dark:text-green-400">
                  <strong>Automatic Processing:</strong> Urgent emails are processed first, then normal priority emails in order.
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading queue stats...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Knowledge Base Info */}
        <Card data-testid="card-knowledge-base" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>RAG Knowledge Base</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <div className="text-lg font-semibold text-purple-600">5</div>
                <p className="text-sm text-muted-foreground">Knowledge Articles</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="text-lg font-semibold text-green-600">3</div>
                <p className="text-sm text-muted-foreground">Categories</p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="text-lg font-semibold text-blue-600">RAG</div>
                <p className="text-sm text-muted-foreground">Context-Aware</p>
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              <strong>Active Knowledge Base:</strong> Refund Policy, Account Access, Shipping Info, Product Support, Subscription Management
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}