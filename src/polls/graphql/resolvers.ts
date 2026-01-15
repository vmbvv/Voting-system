import { PollModel } from "../db/model.ts";
import { badUserInput, unauthenticated } from "../../shared/errors.ts";
import { isValidObjectId } from "../../shared/utils.ts";
import type {
  CreatePollArgs,
  PollArgs,
  PollResultsArgs,
  PollOptionDoc,
} from "../types.ts";

export const pollResolvers = {
  Query: {
    poll: async (_parent: unknown, args: PollArgs) => {
      if (!isValidObjectId(args.id)) {
        throw badUserInput("Invalid poll id");
      }
      return PollModel.findById(args.id).exec();
    },

    pollResults: async (_parent: unknown, args: PollResultsArgs) => {
      if (!isValidObjectId(args.pollId)) {
        throw badUserInput("Invalid poll id");
      }
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
        throw unauthenticated();
      }
      if (!isValidObjectId(context.user._id)) {
        throw unauthenticated("Invalid user");
      }

      const title = args.input.title?.trim();
      if (!title) {
        throw badUserInput("Title is required");
      }

      const rawOptions = args.input.options ?? [];
      const normalizedOptions = rawOptions
        .map((opt) => opt.text?.trim())
        .filter((text): text is string => Boolean(text));

      if (normalizedOptions.length < 2) {
        throw badUserInput("At least 2 options are required");
      }

      const uniqueOptions = new Set(
        normalizedOptions.map((text) => text.toLowerCase())
      );
      if (uniqueOptions.size !== normalizedOptions.length) {
        throw badUserInput("Options must be unique");
      }

      const description = args.input.description?.trim() ?? null;
      const startsAt = args.input.startsAt ?? null;
      const endsAt = args.input.endsAt ?? null;

      if (startsAt && endsAt && endsAt <= startsAt) {
        throw badUserInput("endsAt must be after startsAt");
      }
      if (endsAt) {
        const now = new Date();
        if (endsAt <= now) {
          throw badUserInput("endsAt must be in the future");
        }
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
