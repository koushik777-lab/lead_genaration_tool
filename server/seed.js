import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), "..", ".env") });
import { Lead } from "./src/models/Lead.js";
import { Activity } from "./src/models/Activity.js";
import { Campaign } from "./src/models/Campaign.js";
import { Template } from "./src/models/Template.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/leadforge";

const leads = [
  {
    businessName: "TechNova Solutions",
    ownerName: "Arjun Mehta",
    email: "arjun@technova.com",
    industry: "Software Development",
    location: "Bangalore, India",
    leadScore: 85,
    scoreCategory: "Hot",
    crmStage: "Qualified",
    website: "https://technova.com",
    noWebsite: false,
  },
  {
    businessName: "GreenEarth Organics",
    ownerName: "Sarah Jones",
    email: "sarah@greenearth.org",
    industry: "E-commerce",
    location: "London, UK",
    leadScore: 45,
    scoreCategory: "Warm",
    crmStage: "Contacted",
    website: "https://greenearth.org",
    noWebsite: false,
  },
  {
    businessName: "BlueSky Logistics",
    ownerName: "Robert Wilson",
    email: "robert@bluesky.logistics",
    industry: "Logistics",
    location: "Mumbai, India",
    leadScore: 25,
    scoreCategory: "Cold",
    crmStage: "New Lead",
    noWebsite: true,
  },
  {
    businessName: "Zenith Digital",
    ownerName: "Lisa Wong",
    email: "lisa@zenith.ai",
    industry: "AI Services",
    location: "San Francisco, USA",
    leadScore: 92,
    scoreCategory: "Hot",
    crmStage: "Proposal Sent",
    website: "https://zenith.ai",
    noWebsite: false,
  },
  {
    businessName: "Peak Performance Gym",
    ownerName: "Mike Tyson",
    industry: "Fitness",
    location: "New York, USA",
    leadScore: 40,
    scoreCategory: "Warm",
    crmStage: "New Lead",
    noWebsite: false,
    website: "https://peakgym.com",
    poorSeo: true,
  }
];

const templates = [
  {
    name: "Initial Outreach",
    channel: "Email",
    subject: "Helping {{businessName}} grow",
    body: "Hi {{ownerName}},\n\nI noticed your business and would love to help you with lead generation.\n\nBest,\nLeadForge Team",
  },
  {
    name: "LinkedIn Connect",
    channel: "LinkedIn",
    body: "Hi {{ownerName}}, I'd love to connect and discuss how we can help TechNova Solutions.",
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB for seeding...");

    // Clear existing data
    await Lead.deleteMany({});
    await Activity.deleteMany({});
    await Campaign.deleteMany({});
    await Template.deleteMany({});

    // Seed Leads
    const createdLeads = await Lead.insertMany(leads);
    console.log(`Seeded ${createdLeads.length} leads.`);

    // Seed Templates
    const createdTemplates = await Template.insertMany(templates);
    console.log(`Seeded ${createdTemplates.length} templates.`);

    // Seed Campaigns
    await Campaign.create({
      name: "Q2 Expansion",
      channel: "Email",
      status: "Active",
      templateId: createdTemplates[0]._id,
      sentCount: 150,
      openCount: 85,
      replyCount: 12,
    });

    // Seed Activities
    await Activity.create([
      { type: "lead_created", description: "New lead added: TechNova Solutions", leadName: "TechNova Solutions" },
      { type: "stage_changed", description: "Zenith Digital moved to Proposal Sent", leadName: "Zenith Digital" },
      { type: "note_added", description: "Note added to lead: GreenEarth Organics", leadName: "GreenEarth Organics" }
    ]);

    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();
