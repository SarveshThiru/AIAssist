import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, real, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const emails = pgTable("emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sender: text("sender").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  receivedAt: timestamp("received_at").notNull().defaultNow(),
  sentiment: text("sentiment").$type<"positive" | "neutral" | "negative">(),
  urgency: real("urgency").notNull().default(0),
  isUrgent: boolean("is_urgent").notNull().default(false),
  extractedData: jsonb("extracted_data").$type<{
    phone?: string;
    alternateEmail?: string;
    orderIds?: string[];
    productNames?: string[];
    keywords?: string[];
  }>().default({}),
  aiResponse: text("ai_response"),
  status: text("status").$type<"pending" | "processed" | "sent">().notNull().default("pending"),
  processedAt: timestamp("processed_at"),
});

export const insertEmailSchema = createInsertSchema(emails).omit({
  id: true,
  receivedAt: true,
  processedAt: true,
});

export const updateEmailSchema = createInsertSchema(emails).partial().omit({
  id: true,
  receivedAt: true,
});

export type InsertEmail = z.infer<typeof insertEmailSchema>;
export type UpdateEmail = z.infer<typeof updateEmailSchema>;
export type Email = typeof emails.$inferSelect;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});
