import { emails, type Email, type InsertEmail, type UpdateEmail } from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, and, sql } from "drizzle-orm";

export interface IStorage {
  // Email operations
  getAllEmails(): Promise<Email[]>;
  getEmailById(id: string): Promise<Email | undefined>;
  createEmail(email: InsertEmail): Promise<Email>;
  updateEmail(id: string, updates: UpdateEmail): Promise<Email | undefined>;
  getEmailsByFilter(filter: {
    sentiment?: "positive" | "neutral" | "negative";
    urgency?: "urgent" | "normal";
    status?: "pending" | "processed" | "sent";
  }): Promise<Email[]>;
  getAnalytics(): Promise<{
    totalEmails: number;
    urgentEmails: number;
    avgResponseTime: number;
    resolutionRate: number;
    sentimentDistribution: {
      positive: number;
      neutral: number;
      negative: number;
    };
    processingStats: {
      pending: number;
      processed: number;
      sent: number;
    };
  }>;
}

export class DatabaseStorage implements IStorage {
  async getAllEmails(): Promise<Email[]> {
    return await db.select().from(emails).orderBy(desc(emails.receivedAt));
  }

  async getEmailById(id: string): Promise<Email | undefined> {
    const [email] = await db.select().from(emails).where(eq(emails.id, id));
    return email || undefined;
  }

  async createEmail(insertEmail: InsertEmail): Promise<Email> {
    const [email] = await db
      .insert(emails)
      .values(insertEmail)
      .returning();
    return email;
  }

  async updateEmail(id: string, updates: UpdateEmail): Promise<Email | undefined> {
    const [email] = await db
      .update(emails)
      .set(updates)
      .where(eq(emails.id, id))
      .returning();
    return email || undefined;
  }

  async getEmailsByFilter(filter: {
    sentiment?: "positive" | "neutral" | "negative";
    urgency?: "urgent" | "normal";
    status?: "pending" | "processed" | "sent";
  }): Promise<Email[]> {
    const conditions = [];
    
    if (filter.sentiment) {
      conditions.push(eq(emails.sentiment, filter.sentiment));
    }
    
    if (filter.urgency === "urgent") {
      conditions.push(eq(emails.isUrgent, true));
    } else if (filter.urgency === "normal") {
      conditions.push(eq(emails.isUrgent, false));
    }
    
    if (filter.status) {
      conditions.push(eq(emails.status, filter.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    return await db
      .select()
      .from(emails)
      .where(whereClause)
      .orderBy(desc(emails.receivedAt));
  }

  async getAnalytics(): Promise<{
    totalEmails: number;
    urgentEmails: number;
    avgResponseTime: number;
    resolutionRate: number;
    sentimentDistribution: {
      positive: number;
      neutral: number;
      negative: number;
    };
    processingStats: {
      pending: number;
      processed: number;
      sent: number;
    };
  }> {
    // Total emails count
    const [{ totalEmails }] = await db
      .select({ totalEmails: count() })
      .from(emails);

    // Urgent emails count
    const [{ urgentEmails }] = await db
      .select({ urgentEmails: count() })
      .from(emails)
      .where(eq(emails.isUrgent, true));

    // Sentiment distribution
    const sentimentResults = await db
      .select({
        sentiment: emails.sentiment,
        count: count()
      })
      .from(emails)
      .groupBy(emails.sentiment);

    const sentimentDistribution = {
      positive: 0,
      neutral: 0,
      negative: 0
    };

    sentimentResults.forEach(result => {
      if (result.sentiment && sentimentDistribution.hasOwnProperty(result.sentiment)) {
        sentimentDistribution[result.sentiment] = result.count;
      }
    });

    // Calculate percentages
    if (totalEmails > 0) {
      sentimentDistribution.positive = Math.round((sentimentDistribution.positive / totalEmails) * 100);
      sentimentDistribution.neutral = Math.round((sentimentDistribution.neutral / totalEmails) * 100);
      sentimentDistribution.negative = Math.round((sentimentDistribution.negative / totalEmails) * 100);
    }

    // Mock values for response time and resolution rate
    // In a real implementation, these would be calculated from actual data
    const avgResponseTime = 2.4;
    const resolutionRate = 94;

    // Get processing status distribution
    const statusResults = await db
      .select({
        status: emails.status,
        count: count()
      })
      .from(emails)
      .groupBy(emails.status);

    const processingStats = {
      pending: 0,
      processed: 0,
      sent: 0
    };

    statusResults.forEach(result => {
      if (result.status && processingStats.hasOwnProperty(result.status)) {
        processingStats[result.status] = result.count;
      }
    });

    return {
      totalEmails,
      urgentEmails,
      avgResponseTime,
      resolutionRate,
      sentimentDistribution,
      processingStats
    };
  }
}

export const storage = new DatabaseStorage();
