import { PollModel } from "../db/model.ts";
import type {
  CreatePollArgs,
  PollArgs,
  PollResultsArgs,
  PollOptionDoc,
} from "../types.ts";

export const pollResolvers = {
  Query: {
    poll: async (_parent: unknown, args: PollArgs) => {
      return PollModel.findById(args.id).exec();
    },

    pollResults: async (_parent: unknown, args: PollResultsArgs) => {
      const poll = await PollModel.findById(args.pollId).exec();
      if (!poll) return null;

      const totalVotes = poll.totalVotes ?? 0;
      const options = poll.options.map((option: PollOptionDoc) => {
        const voteCount = option.voteCount ?? 0;
        const percent = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

        return {
          optionId: option._id.toString(),
          text: option.text,
          voteCount,
          percent,
        };
      });

      return {
        pollId: poll._id.toString(),
        totalVotes,
        options,
      };
    },
  },

  Mutation: {
    createPoll: async (
      _parent: unknown,
      args: CreatePollArgs,
      context: { user: { _id: string } | null }
    ) => {
      if (!context.user) {
        throw new Error("Authentication required");
      }

      const title = args.input.title?.trim();
      if (!title) {
        throw new Error("Title is required");
      }

      const rawOptions = args.input.options ?? [];
      const normalizedOptions = rawOptions
        .map((opt) => opt.text?.trim())
        .filter((text): text is string => Boolean(text));

      if (normalizedOptions.length < 2) {
        throw new Error("At least 2 options are required");
      }

      const uniqueOptions = new Set(
        normalizedOptions.map((text) => text.toLowerCase())
      );
      if (uniqueOptions.size !== normalizedOptions.length) {
        throw new Error("Options must be unique");
      }

      const description = args.input.description?.trim() ?? null;
      const startsAt = args.input.startsAt ?? null;
      const endsAt = args.input.endsAt ?? null;

      if (startsAt && endsAt && endsAt <= startsAt) {
        throw new Error("endsAt must be after startsAt");
      }

      const poll = await PollModel.create({
        title,
        description,
        createdBy: context.user._id,
        startsAt,
        endsAt,
        allowMultiple: args.input.allowMultiple ?? false,
        anonymousVoting: args.input.anonymousVoting ?? false,
        options: normalizedOptions.map((text) => ({ text, voteCount: 0 })),
      });

      return poll;
    },
  },
};
