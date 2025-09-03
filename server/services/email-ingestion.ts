import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { storage } from '../storage';
import { analyzeSentiment, analyzeUrgency, extractInformation } from './openai';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export class EmailIngestionService {
  private config: EmailConfig;
  private supportKeywords = ['support', 'help', 'query', 'request', 'issue', 'problem', 'bug', 'error'];

  constructor(config: EmailConfig) {
    this.config = config;
  }

  private isSupportEmail(subject: string, body: string): boolean {
    const text = `${subject} ${body}`.toLowerCase();
    return this.supportKeywords.some(keyword => text.includes(keyword));
  }

  async fetchEmails(sinceDate?: Date): Promise<number> {
    const client = new ImapFlow({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: this.config.auth,
      logger: false
    });

    try {
      await client.connect();
      
      // Select INBOX
      await client.mailboxOpen('INBOX');

      // Search for emails since date (or last 7 days if not specified)
      const searchDate = sinceDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const messages = client.fetch(
        { since: searchDate },
        { 
          envelope: true, 
          source: true,
          flags: true 
        }
      );

      let processedCount = 0;
      
      for await (const message of messages) {
        try {
          // Parse the email
          if (!message.source) continue;
          const parsed = await simpleParser(message.source);
          
          const subject = parsed.subject || 'No Subject';
          const body = parsed.text || parsed.html?.toString() || '';
          const sender = parsed.from?.text || 'Unknown Sender';

          // Filter for support-related emails only
          if (!this.isSupportEmail(subject, body)) {
            continue;
          }

          // Check if email already exists (avoid duplicates)
          const existingEmails = await storage.getAllEmails();
          const exists = existingEmails.some(email => 
            email.sender === sender && 
            email.subject === subject &&
            Math.abs(new Date(email.receivedAt).getTime() - (parsed.date?.getTime() || Date.now())) < 60000 // within 1 minute
          );

          if (exists) {
            continue;
          }

          // Process with AI
          const [sentimentResult, urgencyResult, extractedData] = await Promise.all([
            analyzeSentiment(body).catch(() => ({ sentiment: 'neutral' as const, confidence: 0.5 })),
            analyzeUrgency(body).catch(() => ({ urgency: 0.3, isUrgent: false })),
            extractInformation(body).catch(() => ({}))
          ]);

          // Store in database
          await storage.createEmail({
            sender,
            subject,
            body,
            sentiment: sentimentResult.sentiment,
            urgency: urgencyResult.urgency,
            isUrgent: urgencyResult.isUrgent,
            extractedData,
          });

          processedCount++;
          
        } catch (error) {
          console.error('Error processing email:', error);
        }
      }

      await client.logout();
      return processedCount;
      
    } catch (error) {
      console.error('IMAP connection error:', error);
      throw error;
    }
  }
}

// Gmail IMAP configuration example
export const createGmailConfig = (email: string, appPassword: string): EmailConfig => ({
  host: 'imap.gmail.com',
  port: 993,
  secure: true,
  auth: {
    user: email,
    pass: appPassword
  }
});

// Outlook IMAP configuration example  
export const createOutlookConfig = (email: string, password: string): EmailConfig => ({
  host: 'outlook.office365.com',
  port: 993,
  secure: true,
  auth: {
    user: email,
    pass: password
  }
});