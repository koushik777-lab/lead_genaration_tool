import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", required: true },
    content: { type: String, required: true },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

noteSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    ret.leadId = ret.leadId.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Note = mongoose.model("Note", noteSchema);
