import mongoose from "mongoose";
import { Template } from "./src/models/Template.js";
import dotenv from "dotenv";

dotenv.config();

const templates = [
  {
    name: "Cold Intro: Business Value",
    channel: "Email",
    subject: "Quick question regarding {{businessName}}",
    body: "Hi {{ownerName}},\n\nI was looking at {{businessName}} today and noticed some exciting growth. We've helped similar companies in {{industry}} increase their leads by 30% using our Elite tool. \n\nAre you open to a 5-minute chat this week?\n\nBest,\nTeam LeadForge"
  },
  {
    name: "WhatsApp: Casual Intro",
    channel: "WhatsApp",
    body: "Hi {{ownerName}}! 👋 Saw your business {{businessName}} online. I specialize in helping local companies in {{location}} automate their sales. Would love to share a quick idea with you. Free for a quick text?"
  },
  {
    name: "LinkedIn: Industry Connection",
    channel: "LinkedIn",
    body: "Hi {{ownerName}}, I've been following the work you're doing at {{businessName}}. I love your approach to {{industry}}. I'd love to connect and keep in touch with your progress!"
  },
  {
    name: "SEO Audit Offer (High Value)",
    channel: "Email",
    subject: "Free SEO Audit for {{businessName}}",
    body: "Hello {{ownerName}},\n\nI ran a quick performance check on {{website}} and found 3 major areas where you're losing traffic to competitors. \n\nI've already prepared a small report for {{businessName}}. Should I send it over? \n\nNo strings attached.\n\nRegards."
  },
  {
    name: "Follow-up: Just Checking In",
    channel: "Email",
    subject: "Follow up: {{businessName}}",
    body: "Hi {{ownerName}},\n\nJust bubbling this up in your inbox. I know you're busy running {{businessName}}, but I truly believe our tool can save you 10+ hours a week. \n\nWorth a quick look? \n\nCheers."
  },
  {
    name: "WhatsApp: Discount Offer",
    channel: "WhatsApp",
    body: "Hey {{ownerName}}! 🎁 Exclusive offer for {{businessName}}. We're giving a 50% discount on our Elite plan for the next 48 hours. Want to claim it?"
  },
  {
    name: "LinkedIn: Meeting Request",
    channel: "LinkedIn",
    body: "Hi {{ownerName}}, I'm working with a few founders in the {{industry}} space and we've discovered a new way to scale outbound. I'd love to show you how {{businessName}} can implement this. Do you have 10 mins on Thursday?"
  },
  {
    name: "Website Performance Alert",
    channel: "Email",
    subject: "Important: Your website {{website}} is loading slow",
    body: "Hi {{ownerName}},\n\nDid you know that 40% of users leave a site if it takes more than 3 seconds to load? I checked {{businessName}}'s site and it's currently at 5.2s. \n\nI can help you fix this for free today. Interested?"
  },
  {
    name: "WhatsApp: Referral Request",
    channel: "WhatsApp",
    body: "Hi {{ownerName}}, hope {{businessName}} is doing well! 🚀 Who is the best person to speak with about marketing automation at your company? Thanks!"
  },
  {
    name: "The 'Break-up' Email",
    channel: "Email",
    subject: "Moving on from {{businessName}}",
    body: "Hi {{ownerName}},\n\nI haven't heard back, so I assume marketing automation isn't a priority for {{businessName}} right now. \n\nI'll stop reaching out. If things change, you know where to find me. \n\nWish you the best!"
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB...");
    
    // Clear existing to avoid duplicates if you run multiple times
    await Template.deleteMany({ name: { $in: templates.map(t => t.name) } });
    
    await Template.insertMany(templates);
    console.log("Successfully seeded 10 readymade templates! ✅");
    
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();
