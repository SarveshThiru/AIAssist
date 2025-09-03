import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Mail, AlertTriangle, Clock, CheckCircle, TrendingUp, TrendingDown } from "lucide-react";
import { Analytics } from "@/lib/types";

export function AnalyticsDashboard() {
  const { data: analytics, isLoading } = useQuery<Analytics>({
    queryKey: ["/api/analytics"],
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Failed to load analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-1">Monitor support performance and trends</p>
      </header>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        <Card data-testid="card-total-emails">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-total-emails">
              {analytics.totalEmails}
            </div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12% from yesterday
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-urgent-emails">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Emails</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive" data-testid="metric-urgent-emails">
              {analytics.urgentEmails}
            </div>
            <div className="flex items-center text-xs text-destructive">
              <TrendingUp className="w-3 h-3 mr-1" />
              +2 from yesterday
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-response-time">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-response-time">
              {analytics.avgResponseTime}h
            </div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingDown className="w-3 h-3 mr-1" />
              -15% improvement
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-resolution-rate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-resolution-rate">
              {analytics.resolutionRate}%
            </div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              +3% improvement
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-processing-status">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-green-600">Processed:</span>
                <span className="font-bold text-green-600" data-testid="status-processed">
                  {analytics.processingStats?.processed || 0}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-yellow-600">Pending:</span>
                <span className="font-bold text-yellow-600" data-testid="status-pending">
                  {analytics.processingStats?.pending || 0}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-blue-600">Sent:</span>
                <span className="font-bold text-blue-600" data-testid="status-sent">
                  {analytics.processingStats?.sent || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Distribution */}
        <Card data-testid="card-sentiment-distribution">
          <CardHeader>
            <CardTitle>Sentiment Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Positive</span>
                </div>
                <Badge variant="secondary" data-testid="sentiment-positive">
                  {analytics.sentimentDistribution.positive}%
                </Badge>
              </div>
              <Progress 
                value={analytics.sentimentDistribution.positive} 
                className="h-2"
                data-testid="progress-positive"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Neutral</span>
                </div>
                <Badge variant="secondary" data-testid="sentiment-neutral">
                  {analytics.sentimentDistribution.neutral}%
                </Badge>
              </div>
              <Progress 
                value={analytics.sentimentDistribution.neutral} 
                className="h-2"
                data-testid="progress-neutral"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span className="text-sm">Negative</span>
                </div>
                <Badge variant="secondary" data-testid="sentiment-negative">
                  {analytics.sentimentDistribution.negative}%
                </Badge>
              </div>
              <Progress 
                value={analytics.sentimentDistribution.negative} 
                className="h-2"
                data-testid="progress-negative"
              />
            </div>
          </CardContent>
        </Card>

        {/* Response Time Trend */}
        <Card data-testid="card-response-trend">
          <CardHeader>
            <CardTitle>Response Time Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-lg flex items-center justify-center">
                <TrendingUp className="w-8 h-8 opacity-50" />
              </div>
              <p className="font-medium mb-2">Interactive Chart</p>
              <p className="text-sm">Showing 7-day response time trends</p>
              <div className="mt-4 text-xs">
                <div className="flex justify-between items-center mb-2">
                  <span>Today</span>
                  <span className="font-medium">2.1h avg</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span>Yesterday</span>
                  <span className="font-medium">2.8h avg</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Week avg</span>
                  <span className="font-medium">{analytics.avgResponseTime}h avg</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
