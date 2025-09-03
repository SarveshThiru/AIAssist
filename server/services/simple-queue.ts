// Simple in-memory priority queue for demo purposes (no Redis required)
import { storage } from '../storage';
import { generateRAGResponse } from './knowledge-base';

interface QueueItem {
  emailId: string;
  priority: number; // 1 = urgent, 10 = normal
  addedAt: Date;
}

class SimpleQueue {
  private queue: QueueItem[] = [];
  private processing = false;

  add(emailId: string, isUrgent: boolean = false) {
    const priority = isUrgent ? 1 : 10;
    this.queue.push({
      emailId,
      priority,
      addedAt: new Date()
    });

    // Sort by priority (lower number = higher priority)
    this.queue.sort((a, b) => a.priority - b.priority);

    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    console.log('Starting queue processing...');

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) break;

      try {
        console.log(`Processing ${item.priority === 1 ? 'urgent' : 'normal'} email: ${item.emailId}`);
        await this.processEmail(item.emailId);
      } catch (error) {
        console.error(`Error processing email ${item.emailId}:`, error);
      }
    }

    this.processing = false;
    console.log('Queue processing completed');
  }

  private async processEmail(emailId: string) {
    const email = await storage.getEmailById(emailId);
    if (!email) {
      console.error(`Email not found: ${emailId}`);
      return;
    }

    // Generate AI response if not already generated
    if (!email.aiResponse) {
      const response = await generateRAGResponse({
        sender: email.sender,
        subject: email.subject,
        body: email.body,
        sentiment: email.sentiment || 'neutral',
        extractedData: email.extractedData || {},
      });

      await storage.updateEmail(emailId, {
        aiResponse: response,
        status: 'processed',
        processedAt: new Date(),
      });

      console.log(`Generated AI response for email ${emailId}`);
    }
  }

  getStats() {
    const urgent = this.queue.filter(item => item.priority === 1);
    const normal = this.queue.filter(item => item.priority === 10);
    
    return {
      urgent: {
        waiting: urgent.length,
        active: this.processing ? 1 : 0,
      },
      normal: {
        waiting: normal.length,
        active: 0,
      },
      total: {
        waiting: this.queue.length,
        active: this.processing ? 1 : 0,
      }
    };
  }

  getQueueLength() {
    return this.queue.length;
  }
}

// Export singleton instance
export const emailQueue = new SimpleQueue();

// Queue management functions
export async function addEmailToQueue(emailId: string, isUrgent: boolean = false) {
  emailQueue.add(emailId, isUrgent);
  console.log(`Added email ${emailId} to ${isUrgent ? 'urgent' : 'normal'} queue`);
}

export async function getQueueStats() {
  return emailQueue.getStats();
}