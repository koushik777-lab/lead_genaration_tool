import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const leadsTable = pgTable("leads", {
  id: serial("id").primaryKey(),
  businessName: text("business_name").notNull(),
  ownerName: text("owner_name"),
  email: text("email"),
  phone: text("phone"),
  whatsappActive: boolean("whatsapp_active"),
  website: text("website"),
  linkedinProfile: text("linkedin_profile"),
  companySize: text("company_size"),
  industry: text("industry"),
  location: text("location"),
  country: text("country"),
  techStack: text("tech_stack"),
  seoScore: integer("seo_score"),
  performanceScore: integer("performance_score"),
  leadScore: integer("lead_score").notNull().default(0),
  scoreCategory: text("score_category").notNull().default("Cold"),
  crmStage: text("crm_stage").notNull().default("New Lead"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  noWebsite: boolean("no_website").notNull().default(false),
  poorSeo: boolean("poor_seo").notNull().default(false),
  noSocialPresence: boolean("no_social_presence").notNull().default(false),
  mobileUnfriendly: boolean("mobile_unfriendly").notNull().default(false),
  aiInsight: text("ai_insight"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leadsTable).omit({ id: true, leadScore: true, scoreCategory: true, createdAt: true, updatedAt: true });
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leadsTable.$inferSelect;
