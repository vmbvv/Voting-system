import mongoose, { type InferSchemaType, type Model } from "mongoose";

const { Schema } = mongoose;

const PollOptionSchema = new Schema(
  {
    text: { type: String, required: true, trim: true },
    voteCount: { type: Number, required: true, default: 0, min: 0 },
  },
  { _id: true }
);

const PollSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, trim: true, maxlength: 2000 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["OPEN", "CLOSED"],
      required: true,
      default: "OPEN",
    },
    startsAt: { type: Date },
    endsAt: { type: Date },
    closedAt: { type: Date },
    allowMultiple: { type: Boolean, required: true, default: false },
    anonymousVoting: { type: Boolean, required: true, default: false },
    options: { type: [PollOptionSchema], required: true },
    totalVotes: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true }
);

PollSchema.index({ createdBy: 1, createdAt: -1 });
PollSchema.index({ status: 1, endsAt: 1 });
PollSchema.index({ title: "text", description: "text" });
type PollDoc = InferSchemaType<typeof PollSchema>;

export const PollModel =
  (mongoose.models.Poll as Model<PollDoc>) ||
  mongoose.model<PollDoc>("Poll", PollSchema);
