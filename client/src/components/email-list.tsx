import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Tag, TrendingUp, Bot } from "lucide-react";
import { Email } from "@/lib/types";
import { useState } from "react";

interface EmailListProps {
  filter: {
    sentiment?: "positive" | "neutral" | "negative";
    urgency?: "urgent" | "normal";
    status?: "pending" | "processed" | "sent";
  };
  onEmailSelect: (emailId: string) => void;
  selectedEmailId: string | null;
}

export function EmailList({ filter, onEmailSelect, selectedEmailId }: EmailListProps) {
  const [sortBy, setSortBy] = useState<string>("all");

  const queryParams = new URLSearchParams();
  if (filter.sentiment) queryParams.append("sentiment", filter.sentiment);
  if (filter.urgency) queryParams.append("urgency", filter.urgency);
  if (filter.status) queryParams.append("status", filter.status);

  const { data: emails = [], isLoading } = useQuery({
    queryKey: ["/api/emails", ...Object.values(filter)],
    queryFn: async () => {
      const url = `/api/emails${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch emails");
      return res.json();
    },
  });

  const filteredEmails = emails.filter((email: Email) => {
    if (sortBy === "all") return true;
    if (sortBy === "urgent") return email.isUrgent;
    if (sortBy === "normal") return !email.isUrgent;
    if (sortBy === "positive" || sortBy === "neutral" || sortBy === "negative") {
      return email.sentiment === sortBy;
    }
    return true;
  });

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case "positive": return "bg-green-500";
      case "negative": return "bg-red-500";
      case "neutral": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const getSentimentBadgeVariant = (sentiment?: string) => {
    switch (sentiment) {
      case "positive": return "default";
      case "negative": return "destructive";
      case "neutral": return "secondary";
      default: return "secondary";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours === 1) return "1 hour ago";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "1 day ago";
    return `${diffInDays} days ago`;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading emails...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Support Inbox</h1>
            <p className="text-muted-foreground mt-1">Manage customer inquiries with AI assistance</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40" data-testid="select-filter">
                <SelectValue placeholder="Filter emails" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Emails</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Email List */}
      <div className="flex-1 overflow-auto p-6">
        {filteredEmails.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No emails found</h3>
              <p>No emails match the current filter criteria.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEmails.map((email: Email) => (
              <Card
                key={email.id}
                className={`p-4 hover:shadow-md transition-shadow cursor-pointer ${
                  selectedEmailId === email.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => onEmailSelect(email.id)}
                data-testid={`email-item-${email.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={email.isUrgent ? "destructive" : "secondary"}>
                        {email.isUrgent ? "URGENT" : "NORMAL"}
                      </Badge>
                      {email.sentiment && (
                        <Badge variant={getSentimentBadgeVariant(email.sentiment)}>
                          {email.sentiment.charAt(0).toUpperCase() + email.sentiment.slice(1)}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(email.receivedAt)}
                      </span>
                    </div>
                    
                    <h3 className="font-medium text-foreground mb-1" data-testid={`email-subject-${email.id}`}>
                      {email.subject}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2" data-testid={`email-sender-${email.id}`}>
                      From: {email.sender}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {email.body.substring(0, 150)}...
                    </p>

                    {/* Extracted Metadata */}
                    <div className="flex items-center gap-4 text-xs">
                      {email.extractedData?.phone && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          <span data-testid={`email-phone-${email.id}`}>{email.extractedData.phone}</span>
                        </span>
                      )}
                      {email.extractedData?.orderIds && email.extractedData.orderIds.length > 0 && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Tag className="w-3 h-3" />
                          <span data-testid={`email-order-${email.id}`}>{email.extractedData.orderIds[0]}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <TrendingUp className="w-3 h-3" />
                        <span data-testid={`email-urgency-${email.id}`}>Urgency: {email.urgency.toFixed(1)}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      {email.status === "sent" ? (
                        <span className="text-green-600 text-sm">
                          <span className="inline-block w-2 h-2 bg-green-600 rounded-full mr-1"></span>
                          Sent
                        </span>
                      ) : email.aiResponse ? (
                        <span className="text-blue-600 text-sm">
                          <Bot className="w-4 h-4 inline mr-1" />
                          Ready to Send
                        </span>
                      ) : (
                        <Button variant="ghost" size="sm" data-testid={`button-generate-${email.id}`}>
                          <Bot className="w-4 h-4 mr-1" />
                          Generate Reply
                        </Button>
                      )}
                    </div>
                    <span className={`w-3 h-3 rounded-full ${
                      email.isUrgent ? 'bg-red-500' : 'bg-green-500'
                    }`}></span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
