import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    status: { type: String, default: "Draft", enum: ["Draft", "Active", "Paused", "Completed"] },
    channel: { type: String, required: true, enum: ["Email", "LinkedIn", "WhatsApp", "SMS"] },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: "Template", default: null },
    sentCount: { type: Number, default: 0 },
    openCount: { type: Number, default: 0 },
    replyCount: { type: Number, default: 0 },
    isScheduled: { type: Boolean, default: false },
    scheduledAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

campaignSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    if (ret.templateId) ret.templateId = ret.templateId.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Campaign = mongoose.model("Campaign", campaignSchema);
