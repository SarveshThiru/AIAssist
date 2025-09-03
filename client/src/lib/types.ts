export type Email = {
  id: string;
  sender: string;
  subject: string;
  body: string;
  receivedAt: string;
  sentiment?: "positive" | "neutral" | "negative";
  urgency: number;
  isUrgent: boolean;
  extractedData?: {
    phone?: string;
    alternateEmail?: string;
    orderIds?: string[];
    productNames?: string[];
    keywords?: string[];
  };
  aiResponse?: string;
  status: "pending" | "processed" | "sent";
  processedAt?: string;
};

export type Analytics = {
  totalEmails: number;
  urgentEmails: number;
  avgResponseTime: number;
  resolutionRate: number;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
};
