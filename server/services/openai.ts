import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface SentimentAnalysis {
  sentiment: "positive" | "neutral" | "negative";
  confidence: number;
}

export interface UrgencyAnalysis {
  urgency: number;
  isUrgent: boolean;
}

export interface ExtractedData {
  phone?: string;
  alternateEmail?: string;
  orderIds?: string[];
  productNames?: string[];
  keywords?: string[];
}

export async function analyzeSentiment(text: string): Promise<SentimentAnalysis> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a sentiment analysis expert. Analyze the sentiment of the email text and provide a sentiment classification (positive, neutral, or negative) and a confidence score between 0 and 1. Respond with JSON in this format: { 'sentiment': 'positive|neutral|negative', 'confidence': number }"
        },
        {
          role: "user",
          content: text,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      sentiment: result.sentiment || "neutral",
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
    };
  } catch (error) {
    console.error("Failed to analyze sentiment:", error);
    return { sentiment: "neutral", confidence: 0.5 };
  }
}

export async function analyzeUrgency(text: string): Promise<UrgencyAnalysis> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an urgency analysis expert for customer support emails. Analyze the urgency of the email based on keywords like 'immediately', 'critical', 'cannot access', 'outage', 'refund', 'down', 'not working', 'emergency', etc. Provide an urgency score between 0 and 1, where scores >= 0.6 indicate urgent emails. Respond with JSON in this format: { 'urgency': number, 'isUrgent': boolean }"
        },
        {
          role: "user",
          content: text,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    const urgency = Math.max(0, Math.min(1, result.urgency || 0));
    
    return {
      urgency,
      isUrgent: urgency >= 0.6,
    };
  } catch (error) {
    console.error("Failed to analyze urgency:", error);
    return { urgency: 0.3, isUrgent: false };
  }
}

export async function extractInformation(text: string): Promise<ExtractedData> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an information extraction expert. Extract key information from customer support emails including phone numbers, alternate emails, order IDs, product names, and important keywords. Respond with JSON in this format: { 'phone': string|null, 'alternateEmail': string|null, 'orderIds': string[], 'productNames': string[], 'keywords': string[] }"
        },
        {
          role: "user",
          content: text,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      phone: result.phone || undefined,
      alternateEmail: result.alternateEmail || undefined,
      orderIds: result.orderIds || [],
      productNames: result.productNames || [],
      keywords: result.keywords || [],
    };
  } catch (error) {
    console.error("Failed to extract information:", error);
    return {};
  }
}

export async function generateResponse(emailData: {
  sender: string;
  subject: string;
  body: string;
  sentiment: string;
  extractedData: ExtractedData;
}): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an empathetic customer support assistant. Generate a professional, context-aware response to customer emails. 

Guidelines:
- Be empathetic and understanding, especially for negative sentiment emails
- Reference specific information from the email (order IDs, product names, etc.)
- Provide clear next steps or ask clarifying questions
- Keep responses concise but helpful
- Always maintain a professional and friendly tone
- Include a case reference number in format: CASE-2024-XXXX (use random 4 digits)

Customer sentiment: ${emailData.sentiment}
Extracted data: ${JSON.stringify(emailData.extractedData)}`
        },
        {
          role: "user",
          content: `Original email from ${emailData.sender}:
Subject: ${emailData.subject}

${emailData.body}

Please generate an appropriate response.`,
        },
      ],
    });

    return response.choices[0].message.content || "Thank you for contacting us. We'll review your request and get back to you soon.";
  } catch (error) {
    console.error("Failed to generate response:", error);
    return "Thank you for contacting us. We'll review your request and get back to you soon.";
  }
}
