import { PollModel } from "../db/model.ts";
import { VoteModel } from "../../votes/db/model.ts";
import { UserModel } from "../../users/db/model.ts";
import {
  badUserInput,
  forbidden,
  notFound,
  unauthenticated,
} from "../../shared/errors.ts";
import { isValidObjectId } from "../../shared/utils.ts";
import type {
  CreatePollArgs,
  PollArgs,
  PollOptionVotersArgs,
  PollResultsArgs,
  PollOptionDoc,
  PollsArgs,
  PollsInput,
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
    polls: async (_parent: unknown, args: PollsArgs) => {
      const input: PollsInput = args.input ?? {};
      const filter: Record<string, unknown> = {};
      if (input.status === "OPEN") {
        const now = new Date();
        filter.status = "OPEN";
        filter.$or = [
          { endsAt: null },
          { endsAt: { $exists: false } },
          { endsAt: { $gt: now } },
        ];
      } else if (input.status === "CLOSED") {
        const now = new Date();
        filter.$or = [{ status: "CLOSED" }, { endsAt: { $lte: now } }];
      }
      const search = input.search?.trim();
      if (search) {
        filter.$text = { $search: search };
      }

      const pageSize = Math.min(Math.max(input.pageSize ?? 5, 1), 20);
      const page = Math.max(input.page ?? 1, 1);
      const sortOrder = input.sort?.order === "ASC" ? 1 : -1;

      const totalCount = await PollModel.countDocuments(filter).exec();
      const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1);
      const currentPage = Math.min(page, totalPages);
      const skip = (currentPage - 1) * pageSize;

      const items = await PollModel.find(filter)
        .sort({ createdAt: sortOrder })
        .skip(skip)
        .limit(pageSize)
        .exec();

      return {
        items,
        page: currentPage,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      };
    },

    pollOptionVoters: async (
      _parent: unknown,
      args: PollOptionVotersArgs,
      context: { user: { _id: string } | null }
    ) => {
      if (!context.user) {
        throw unauthenticated();
      }

      const input = args.input;

      if (!isValidObjectId(input.pollId)) {
        throw badUserInput("Invalid poll id");
      }
      if (!isValidObjectId(input.optionId)) {
        throw badUserInput("Invalid option id");
      }

      const poll = await PollModel.findById(input.pollId).exec();
      if (!poll) {
        throw notFound("Poll not found");
      }
      if (poll.anonymousVoting) {
        throw forbidden("Anonymous poll");
      }

      const optionExists = poll.options.some(
        (option) => option._id.toString() === input.optionId
      );
      if (!optionExists) {
        throw badUserInput("Option not found");
      }

      const pageSize = Math.min(Math.max(input.pageSize ?? 20, 1), 50);
      const page = Math.max(input.page ?? 1, 1);

      const totalCount = await VoteModel.countDocuments({
        pollId: poll._id,
        optionIds: input.optionId,
      }).exec();
      const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1);
      const currentPage = Math.min(page, totalPages);
      const skip = (currentPage - 1) * pageSize;

      const votes = await VoteModel.find({
        pollId: poll._id,
        optionIds: input.optionId,
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .select("userId")
        .exec();

      const userIds = votes.map((vote) => vote.userId.toString());
      if (userIds.length === 0) {
        return {
          items: [],
          page: currentPage,
          pageSize,
          totalCount,
          totalPages,
          hasNextPage: currentPage < totalPages,
          hasPreviousPage: currentPage > 1,
        };
      }

      const users = await UserModel.find({ _id: { $in: userIds } }).exec();
      const userMap = new Map(users.map((user) => [user._id.toString(), user]));
      const items = userIds
        .map((id) => userMap.get(id))
        .filter((user): user is typeof users[number] => Boolean(user));

      return {
        items,
        page: currentPage,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      };
    },
  },

  Mutation: {
    createPoll: async (
      _parent: unknown,
      args: CreatePollArgs,
      context: { user: { _id: string } | null },
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
        normalizedOptions.map((text) => text.toLowerCase()),
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

    closePoll: async (
      _parent: unknown,
      args: { id: string },
      context: { user: { _id: string } | null }
    ) => {
      if (!context.user) {
        throw unauthenticated();
      }
      if (!isValidObjectId(context.user._id)) {
        throw unauthenticated("Invalid user");
      }
      if (!isValidObjectId(args.id)) {
        throw badUserInput("Invalid poll id");
      }

      const poll = await PollModel.findById(args.id).exec();
      if (!poll) {
        throw notFound("Poll not found");
      }

      if (poll.createdBy.toString() !== context.user._id) {
        throw forbidden("Only the poll owner can close it");
      }

      if ((poll.status as string) !== "CLOSED") {
        poll.status = "CLOSED";
        poll.closedAt = poll.closedAt ?? new Date();
        await poll.save();
      }

      return poll;
    },

    deletePoll: async (
      _parent: unknown,
      args: { id: string },
      context: { user: { _id: string } | null }
    ) => {
      if (!context.user) {
        throw unauthenticated();
      }
      if (!isValidObjectId(args.id)) {
        throw badUserInput("Invalid poll id");
      }

      const poll = await PollModel.findById(args.id).exec();
      if (!poll) {
        throw notFound("Poll not found");
      }

      const now = new Date();
      const isClosed =
        (poll.status as string) === "CLOSED" ||
        (poll.endsAt && poll.endsAt <= now);
      if (!isClosed) {
        throw badUserInput("Poll must be closed before deleting");
      }

      await VoteModel.deleteMany({ pollId: poll._id }).exec();
      await PollModel.deleteOne({ _id: poll._id }).exec();

      return true;
    },
  },
};
