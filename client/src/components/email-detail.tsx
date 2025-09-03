import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { X, Send, Edit, Bot, Phone, Tag, TrendingUp } from "lucide-react";
import { Email } from "@/lib/types";
import { useState } from "react";

interface EmailDetailProps {
  emailId: string;
  onClose: () => void;
}

export function EmailDetail({ emailId, onClose }: EmailDetailProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingResponse, setEditingResponse] = useState(false);
  const [responseText, setResponseText] = useState("");

  const { data: email, isLoading } = useQuery<Email>({
    queryKey: ["/api/emails", emailId],
  });

  const generateResponseMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/emails/${emailId}/generate-response`);
      return res.json();
    },
    onSuccess: (updatedEmail) => {
      queryClient.setQueryData(["/api/emails", emailId], updatedEmail);
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      setResponseText(updatedEmail.aiResponse);
      toast({
        title: "Response Generated",
        description: "AI response has been generated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate AI response",
        variant: "destructive",
      });
    },
  });

  const sendResponseMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/emails/${emailId}/send`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      toast({
        title: "Response Sent",
        description: "Email response has been sent successfully",
      });
    },
    onError: () => {
      toast({
        title: "Send Failed",
        description: "Failed to send email response",
        variant: "destructive",
      });
    },
  });

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

  const getSentimentBadgeVariant = (sentiment?: string) => {
    switch (sentiment) {
      case "positive": return "default";
      case "negative": return "destructive";
      case "neutral": return "secondary";
      default: return "secondary";
    }
  };

  if (isLoading) {
    return (
      <div className="w-96 bg-card border-l border-border flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="w-96 bg-card border-l border-border flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Email not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 bg-card border-l border-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Email Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-detail">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">From</p>
            <p className="font-medium" data-testid="detail-sender">{email.sender}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Subject</p>
            <p className="font-medium" data-testid="detail-subject">{email.subject}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Received</p>
            <p className="text-sm">{formatTimeAgo(email.receivedAt)}</p>
          </div>
          <div className="flex gap-2">
            <Badge variant={email.isUrgent ? "destructive" : "secondary"}>
              {email.isUrgent ? "URGENT" : "NORMAL"}
            </Badge>
            {email.sentiment && (
              <Badge variant={getSentimentBadgeVariant(email.sentiment)}>
                {email.sentiment.charAt(0).toUpperCase() + email.sentiment.slice(1)}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* Original Email */}
          <div>
            <h3 className="font-medium mb-3">Original Message</h3>
            <Card className="p-4">
              <div className="text-sm whitespace-pre-wrap" data-testid="detail-body">
                {email.body}
              </div>
            </Card>
          </div>

          {/* Extracted Information */}
          {email.extractedData && Object.keys(email.extractedData).length > 0 && (
            <div>
              <h3 className="font-medium mb-3">Extracted Information</h3>
              <div className="space-y-2 text-sm">
                {email.extractedData.phone && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      Phone:
                    </span>
                    <span data-testid="detail-phone">{email.extractedData.phone}</span>
                  </div>
                )}
                {email.extractedData.alternateEmail && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Alt Email:</span>
                    <span data-testid="detail-alt-email">{email.extractedData.alternateEmail}</span>
                  </div>
                )}
                {email.extractedData.orderIds && email.extractedData.orderIds.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Tag className="w-4 h-4" />
                      Order IDs:
                    </span>
                    <span data-testid="detail-orders">{email.extractedData.orderIds.join(", ")}</span>
                  </div>
                )}
                {email.extractedData.productNames && email.extractedData.productNames.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Products:</span>
                    <span data-testid="detail-products">{email.extractedData.productNames.join(", ")}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="w-4 h-4" />
                    Urgency Score:
                  </span>
                  <span className={`font-medium ${email.isUrgent ? 'text-red-600' : 'text-green-600'}`} data-testid="detail-urgency">
                    {email.urgency.toFixed(1)}
                  </span>
                </div>
                {email.extractedData.keywords && email.extractedData.keywords.length > 0 && (
                  <div className="flex items-start justify-between">
                    <span className="text-muted-foreground">Keywords:</span>
                    <span className="text-right text-xs" data-testid="detail-keywords">
                      {email.extractedData.keywords.join(", ")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Generated Response */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">AI Generated Response</h3>
              {!email.aiResponse && (
                <Button 
                  size="sm" 
                  onClick={() => generateResponseMutation.mutate()}
                  disabled={generateResponseMutation.isPending}
                  data-testid="button-generate-response"
                >
                  <Bot className="w-4 h-4 mr-1" />
                  {generateResponseMutation.isPending ? "Generating..." : "Generate"}
                </Button>
              )}
            </div>

            {email.aiResponse ? (
              <>
                {editingResponse ? (
                  <div className="space-y-3">
                    <Textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      rows={10}
                      className="text-sm"
                      data-testid="textarea-response"
                    />
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => setEditingResponse(false)}
                        data-testid="button-save-edit"
                      >
                        Save
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setResponseText(email.aiResponse || "");
                          setEditingResponse(false);
                        }}
                        data-testid="button-cancel-edit"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Card className="p-4 bg-primary/5 border-primary/20">
                      <div className="text-sm whitespace-pre-wrap" data-testid="detail-ai-response">
                        {email.aiResponse}
                      </div>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      {email.status !== "sent" && (
                        <Button 
                          className="flex-1"
                          onClick={() => sendResponseMutation.mutate()}
                          disabled={sendResponseMutation.isPending}
                          data-testid="button-send-response"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {sendResponseMutation.isPending ? "Sending..." : "Send Reply"}
                        </Button>
                      )}
                      {email.status === "sent" ? (
                        <Badge variant="default" className="flex-1 justify-center py-2">
                          Response Sent
                        </Badge>
                      ) : (
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setResponseText(email.aiResponse || "");
                            setEditingResponse(true);
                          }}
                          data-testid="button-edit-response"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </>
            ) : (
              <Card className="p-4 text-center text-muted-foreground">
                <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No AI response generated yet</p>
                <p className="text-xs mt-1">Click Generate to create an AI response</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
