import { validate } from "graphql";
import mongoose from "mongoose";

const { Schema } = mongoose;

const VoteSchema = new Schema(
  {
    pollId: { type: Schema.Types.ObjectId, ref: "Poll", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    optionIds: {
      type: [Schema.Types.ObjectId],
      required: true,
      validate: {
        validator: (value: unknown[]) => value.length > 0,
        message: "optionIds must have at least one option",
      },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

VoteSchema.index({ pollId: 1, userId: 1 }, { unique: true });
VoteSchema.index({ pollId: 1, createdAt: -1 });
VoteSchema.index({ userId: 1, createdAt: -1 });

export const VoteModel =
  mongoose.models.Vote || mongoose.model("Vote", VoteSchema);
