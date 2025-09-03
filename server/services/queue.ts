import Queue from 'bull';
import Redis from 'ioredis';
import { storage } from '../storage';
import { analyzeSentiment, analyzeUrgency, extractInformation, generateResponse } from './openai';
import { EmailIngestionService } from './email-ingestion';

// Redis connection for Bull queues
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Create queues with different priorities
export const urgentEmailQueue = new Queue('urgent emails', {
  redis: {
    port: 6379,
    host: 'localhost',
  },
  defaultJobOptions: {
    priority: 1, // High priority
    removeOnComplete: 10,
    removeOnFail: 10,
  }
});

export const normalEmailQueue = new Queue('normal emails', {
  redis: {
    port: 6379,
    host: 'localhost',
  },
  defaultJobOptions: {
    priority: 10, // Lower priority
    removeOnComplete: 10,
    removeOnFail: 10,
  }
});

// Job processors
urgentEmailQueue.process('process-urgent-email', async (job) => {
  console.log(`Processing urgent email: ${job.data.emailId}`);
  return await processEmailJob(job.data.emailId);
});

normalEmailQueue.process('process-normal-email', async (job) => {
  console.log(`Processing normal email: ${job.data.emailId}`);
  return await processEmailJob(job.data.emailId);
});

// Shared email processing logic
async function processEmailJob(emailId: string) {
  try {
    const email = await storage.getEmailById(emailId);
    if (!email) {
      throw new Error(`Email not found: ${emailId}`);
    }

    // Generate AI response if not already generated
    if (!email.aiResponse) {
      const response = await generateResponse({
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
    }

    return { success: true, emailId };
  } catch (error) {
    console.error(`Error processing email ${emailId}:`, error);
    throw error;
  }
}

// Queue management functions
export async function addEmailToQueue(emailId: string, isUrgent: boolean = false) {
  const queue = isUrgent ? urgentEmailQueue : normalEmailQueue;
  const jobType = isUrgent ? 'process-urgent-email' : 'process-normal-email';
  
  await queue.add(jobType, { emailId }, {
    priority: isUrgent ? 1 : 10,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    }
  });
  
  console.log(`Added email ${emailId} to ${isUrgent ? 'urgent' : 'normal'} queue`);
}

export async function getQueueStats() {
  const [urgentWaiting, urgentActive, normalWaiting, normalActive] = await Promise.all([
    urgentEmailQueue.getJobs(['waiting']),
    urgentEmailQueue.getJobs(['active']),
    normalEmailQueue.getJobs(['waiting']), 
    normalEmailQueue.getJobs(['active'])
  ]);

  return {
    urgent: {
      waiting: urgentWaiting.length,
      active: urgentActive.length,
    },
    normal: {
      waiting: normalWaiting.length,
      active: normalActive.length,
    },
    total: {
      waiting: urgentWaiting.length + normalWaiting.length,
      active: urgentActive.length + normalActive.length,
    }
  };
}

// Email ingestion job
export const emailIngestionQueue = new Queue('email ingestion', {
  redis: {
    port: 6379,
    host: 'localhost',
  }
});

emailIngestionQueue.process('ingest-emails', async (job) => {
  const { emailConfig } = job.data;
  console.log('Starting email ingestion...');
  
  try {
    const ingestionService = new EmailIngestionService(emailConfig);
    const count = await ingestionService.fetchEmails();
    console.log(`Ingested ${count} new emails`);
    return { success: true, count };
  } catch (error) {
    console.error('Email ingestion failed:', error);
    throw error;
  }
});

export async function scheduleEmailIngestion(emailConfig: any) {
  await emailIngestionQueue.add('ingest-emails', { emailConfig }, {
    repeat: { cron: '*/10 * * * *' }, // Every 10 minutes
    removeOnComplete: 5,
    removeOnFail: 5,
  });
}