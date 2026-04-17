import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const activityTable = pgTable("activity", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  leadName: text("lead_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Activity = typeof activityTable.$inferSelect;
