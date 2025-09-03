import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// Company knowledge base - this would typically be loaded from a database or CMS
export const knowledgeBase = [
  {
    id: "refund-policy",
    title: "Refund Policy", 
    content: "We offer full refunds within 30 days of purchase. For digital products, refunds are processed within 3-5 business days. For physical products, items must be returned in original condition. Contact billing@company.com for refund requests.",
    category: "billing"
  },
  {
    id: "account-access",
    title: "Account Access Issues",
    content: "If you cannot access your account, try resetting your password first. If the issue persists, verify your email address is correct. For security reasons, we may temporarily lock accounts after multiple failed login attempts. Contact security@company.com for account recovery.",
    category: "technical"
  },
  {
    id: "shipping-info", 
    title: "Shipping Information",
    content: "Standard shipping takes 5-7 business days. Express shipping is available for next-day delivery. International shipping may take 10-14 days. Tracking numbers are provided once items ship. Contact shipping@company.com for delivery issues.",
    category: "shipping"
  },
  {
    id: "product-support",
    title: "Product Support",
    content: "Our products come with 1-year warranty. Common issues can be resolved by restarting the device or checking cable connections. Download user manuals from our support portal. For hardware issues, contact hardware@company.com.",
    category: "product"
  },
  {
    id: "subscription-management",
    title: "Subscription Management", 
    content: "You can upgrade, downgrade, or cancel your subscription anytime from your account dashboard. Billing cycles are monthly or annual. Cancellations take effect at the end of your current billing period. Contact billing@company.com for subscription changes.",
    category: "billing"
  }
];

export interface RAGContext {
  relevantDocs: typeof knowledgeBase;
  query: string;
}

export async function findRelevantKnowledge(query: string): Promise<typeof knowledgeBase> {
  try {
    // Create embeddings for the query
    const queryEmbedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });

    // For now, use simple keyword matching since we don't have vector storage
    // In production, you would use pgvector or Chroma for proper semantic search
    const queryLower = query.toLowerCase();
    const relevantDocs = knowledgeBase.filter(doc => {
      const docText = `${doc.title} ${doc.content}`.toLowerCase();
      
      // Check for keyword overlap
      const queryWords = queryLower.split(/\s+/);
      const matchCount = queryWords.filter(word => 
        word.length > 3 && docText.includes(word)
      ).length;
      
      // Return docs with at least 1 matching keyword
      return matchCount > 0;
    });

    // Sort by relevance (more keyword matches first)
    relevantDocs.sort((a, b) => {
      const aText = `${a.title} ${a.content}`.toLowerCase();
      const bText = `${b.title} ${b.content}`.toLowerCase();
      
      const aMatches = queryLower.split(/\s+/).filter(word => 
        word.length > 3 && aText.includes(word)
      ).length;
      const bMatches = queryLower.split(/\s+/).filter(word => 
        word.length > 3 && bText.includes(word)
      ).length;
      
      return bMatches - aMatches;
    });

    return relevantDocs.slice(0, 3); // Return top 3 most relevant docs
  } catch (error) {
    console.error("Error finding relevant knowledge:", error);
    return knowledgeBase.slice(0, 2); // Fallback to first 2 docs
  }
}

export async function generateRAGResponse(emailData: {
  sender: string;
  subject: string;
  body: string;
  sentiment: string;
  extractedData: any;
}): Promise<string> {
  try {
    // Find relevant knowledge base articles
    const relevantDocs = await findRelevantKnowledge(`${emailData.subject} ${emailData.body}`);
    
    // Format knowledge base context
    const knowledgeContext = relevantDocs.map(doc => 
      `**${doc.title}** (${doc.category}):\n${doc.content}`
    ).join('\n\n');

    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an empathetic customer support assistant with access to company knowledge base. Generate professional, context-aware responses using the provided knowledge base information.

IMPORTANT GUIDELINES:
- Always reference relevant policies and procedures from the knowledge base
- Be empathetic and understanding, especially for negative sentiment emails
- Reference specific information from the email (order IDs, product names, etc.)
- Provide clear next steps based on company policies
- If you cannot find relevant information in the knowledge base, acknowledge this and offer to escalate
- Always include a case reference number in format: CASE-2025-XXXX (use random 4 digits)
- Stay grounded in the provided knowledge - don't make up policies or procedures

KNOWLEDGE BASE CONTEXT:
${knowledgeContext}

Customer sentiment: ${emailData.sentiment}
Extracted data: ${JSON.stringify(emailData.extractedData)}`
        },
        {
          role: "user",
          content: `Customer email from ${emailData.sender}:
Subject: ${emailData.subject}

${emailData.body}

Please generate an appropriate response using the knowledge base information.`
        }
      ],
    });

    return response.choices[0].message.content || "Thank you for contacting us. We'll review your request and get back to you soon.";
  } catch (error) {
    console.error("Failed to generate RAG response:", error);
    return "Thank you for contacting us. We'll review your request and get back to you soon.";
  }
}