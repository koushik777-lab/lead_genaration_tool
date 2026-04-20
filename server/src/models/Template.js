import mongoose from "mongoose";

const templateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    channel: { type: String, required: true, enum: ["Email", "LinkedIn", "WhatsApp", "SMS"] },
    subject: { type: String, default: null },
    body: { type: String, required: true },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

templateSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Template = mongoose.model("Template", templateSchema);
