import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    businessName: { type: String, required: true },
    googlePlaceId: { type: String, unique: true, sparse: true },
    ownerName: { type: String, default: null },
    email: { type: String, default: null },
    phone: { type: String, default: null },
    whatsappActive: { type: Boolean, default: null },
    website: { type: String, default: null },
    linkedinProfile: { type: String, default: null },
    companySize: { type: String, default: null },
    industry: { type: String, default: null },
    location: { type: String, default: null },
    country: { type: String, default: null },
    techStack: { type: String, default: null },
    seoScore: { type: Number, default: null },
    performanceScore: { type: Number, default: null },
    leadScore: { type: Number, default: 0 },
    scoreCategory: { type: String, default: "Cold", enum: ["Hot", "Warm", "Cold"] },
    crmStage: {
      type: String,
      default: "New Lead",
      enum: ["New Lead", "Contacted", "Qualified", "Proposal Sent", "Closed Won", "Closed Lost"],
    },
    tags: { type: [String], default: [] },
    noWebsite: { type: Boolean, default: false },
    poorSeo: { type: Boolean, default: false },
    noSocialPresence: { type: Boolean, default: false },
    mobileUnfriendly: { type: Boolean, default: false },
    aiInsight: { type: String, default: null },
    pushStatus: { type: String, default: "pending", enum: ["pending", "sent", "failed"] },
    sentAt: { type: Date, default: null },
    errorMessage: { type: String, default: null },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

// Virtual id that returns string of _id for frontend compatibility
leadSchema.set("toJSON", {
  virtuals: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Lead = mongoose.model("Lead", leadSchema);
