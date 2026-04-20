import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    description: { type: String, required: true },
    leadName: { type: String, default: null },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

activitySchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Activity = mongoose.model("Activity", activitySchema);
