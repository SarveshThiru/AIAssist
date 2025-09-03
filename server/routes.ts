import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEmailSchema, updateEmailSchema } from "@shared/schema";
import { analyzeSentiment, analyzeUrgency, extractInformation, generateResponse } from "./services/openai";
import { addEmailToQueue, getQueueStats } from "./services/simple-queue";
import { EmailIngestionService, createGmailConfig, createOutlookConfig } from "./services/email-ingestion";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all emails with optional filtering
  app.get("/api/emails", async (req, res) => {
    try {
      const { sentiment, urgency, status } = req.query;
      
      const filter: any = {};
      if (sentiment && typeof sentiment === "string") filter.sentiment = sentiment;
      if (urgency && typeof urgency === "string") filter.urgency = urgency;
      if (status && typeof status === "string") filter.status = status;

      const emails = Object.keys(filter).length > 0 
        ? await storage.getEmailsByFilter(filter)
        : await storage.getAllEmails();
      
      res.json(emails);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch emails" });
    }
  });

  // Get single email by ID
  app.get("/api/emails/:id", async (req, res) => {
    try {
      const email = await storage.getEmailById(req.params.id);
      if (!email) {
        return res.status(404).json({ error: "Email not found" });
      }
      res.json(email);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch email" });
    }
  });

  // Create new email (simulates email ingestion)
  app.post("/api/emails", async (req, res) => {
    try {
      const validatedData = insertEmailSchema.parse(req.body);
      
      // Analyze the email content
      const [sentimentResult, urgencyResult, extractedData] = await Promise.all([
        analyzeSentiment(validatedData.body),
        analyzeUrgency(validatedData.body),
        extractInformation(validatedData.body)
      ]);

      const emailData = {
        ...validatedData,
        sentiment: sentimentResult.sentiment,
        urgency: urgencyResult.urgency,
        isUrgent: urgencyResult.isUrgent,
        extractedData,
      };

      const email = await storage.createEmail(emailData);
      res.status(201).json(email);
    } catch (error) {
      console.error("Error creating email:", error);
      res.status(400).json({ error: "Invalid email data" });
    }
  });

  // Generate AI response for an email
  app.post("/api/emails/:id/generate-response", async (req, res) => {
    try {
      const email = await storage.getEmailById(req.params.id);
      if (!email) {
        return res.status(404).json({ error: "Email not found" });
      }

      const aiResponse = await generateResponse({
        sender: email.sender,
        subject: email.subject,
        body: email.body,
        sentiment: email.sentiment || "neutral",
        extractedData: email.extractedData || {},
      });

      const updatedEmail = await storage.updateEmail(email.id, {
        aiResponse,
        status: "processed",
        processedAt: new Date(),
      });

      res.json(updatedEmail);
    } catch (error) {
      console.error("Error generating response:", error);
      res.status(500).json({ error: "Failed to generate response" });
    }
  });

  // Send email response (marks as sent)
  app.post("/api/emails/:id/send", async (req, res) => {
    try {
      const email = await storage.getEmailById(req.params.id);
      if (!email) {
        return res.status(404).json({ error: "Email not found" });
      }

      if (!email.aiResponse) {
        return res.status(400).json({ error: "No AI response generated yet" });
      }

      const updatedEmail = await storage.updateEmail(email.id, {
        status: "sent",
      });

      res.json(updatedEmail);
    } catch (error) {
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  // Get analytics data
  app.get("/api/analytics", async (req, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Sync emails endpoint (for demo purposes, creates sample emails)
  app.post("/api/emails/sync", async (req, res) => {
    try {
      const sampleEmails = [
        {
          sender: "sarah.johnson@techcorp.com",
          subject: "Critical System Outage - Need Immediate Support",
          body: "Dear Support Team,\n\nOur entire customer portal is down since 2 PM today and we're losing revenue by the minute. This is absolutely critical as we have hundreds of customers trying to place orders.\n\nOur system shows error 500 on all pages. Order ID that was affected: #TC-2024-1891\n\nPlease contact me immediately at +1-555-0123.\n\nBest regards,\nSarah Johnson\nTechCorp Inc."
        },
        {
          sender: "dev.team@startupco.io",
          subject: "Question About API Rate Limits",
          body: "Hi,\n\nWe're integrating your API and wondering about the rate limits for our enterprise plan. Can you provide documentation or clarify the current limits?\n\nAlternate contact: tech@startupco.io\n\nThanks!"
        },
        {
          sender: "mike.rodriguez@gmail.com",
          subject: "Refund Request - Account Charged Incorrectly",
          body: "I was charged twice for my subscription renewal. Please process a refund immediately as this is affecting my business operations. Invoice #INV-2024-3421. My phone is +1-555-0456."
        }
      ];

      const createdEmails = [];
      for (const emailData of sampleEmails) {
        try {
          const [sentimentResult, urgencyResult, extractedData] = await Promise.all([
            analyzeSentiment(emailData.body),
            analyzeUrgency(emailData.body),
            extractInformation(emailData.body)
          ]);

          const processedEmail = {
            ...emailData,
            sentiment: sentimentResult.sentiment,
            urgency: urgencyResult.urgency,
            isUrgent: urgencyResult.isUrgent,
            extractedData,
          };

          const email = await storage.createEmail(processedEmail);
          createdEmails.push(email);
        } catch (error) {
          console.error("Error processing sample email:", error);
        }
      }

      res.json({ 
        message: `Synced ${createdEmails.length} emails`,
        emails: createdEmails 
      });
    } catch (error) {
      console.error("Error syncing emails:", error);
      res.status(500).json({ error: "Failed to sync emails" });
    }
  });

  // Real email ingestion endpoint (for demo - requires email credentials)
  app.post("/api/emails/ingest", async (req, res) => {
    try {
      const { emailType, email, password } = req.body;
      
      if (!emailType || !email || !password) {
        return res.status(400).json({ 
          error: "Email type, email, and password/app-password are required",
          example: {
            emailType: "gmail",
            email: "your-email@gmail.com", 
            password: "your-app-password"
          }
        });
      }

      let config;
      if (emailType === "gmail") {
        config = createGmailConfig(email, password);
      } else if (emailType === "outlook") {
        config = createOutlookConfig(email, password);
      } else {
        return res.status(400).json({ error: "Unsupported email type. Use 'gmail' or 'outlook'" });
      }

      const ingestionService = new EmailIngestionService(config);
      const count = await ingestionService.fetchEmails();
      
      res.json({ 
        message: `Successfully ingested ${count} new support emails from ${emailType}`,
        count,
        note: "Only emails with support-related keywords were imported"
      });
    } catch (error) {
      console.error("Error ingesting emails:", error);
      res.status(500).json({ 
        error: "Failed to ingest emails",
        details: error instanceof Error ? error.message : "Unknown error",
        help: "Make sure your email credentials are correct and app passwords are enabled for Gmail"
      });
    }
  });

  // Queue statistics endpoint
  app.get("/api/queue/stats", async (req, res) => {
    try {
      const stats = await getQueueStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching queue stats:", error);
      res.status(500).json({ error: "Failed to fetch queue statistics" });
    }
  });

  // Process email with queue
  app.post("/api/emails/:id/queue", async (req, res) => {
    try {
      const email = await storage.getEmailById(req.params.id);
      if (!email) {
        return res.status(404).json({ error: "Email not found" });
      }

      await addEmailToQueue(email.id, email.isUrgent);
      
      res.json({ 
        message: `Email added to ${email.isUrgent ? 'urgent' : 'normal'} processing queue`,
        queueType: email.isUrgent ? 'urgent' : 'normal'
      });
    } catch (error) {
      console.error("Error queuing email:", error);
      res.status(500).json({ error: "Failed to queue email" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
