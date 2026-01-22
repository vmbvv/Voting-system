import mongoose from "mongoose";
import { PollModel } from "../../polls/db/model.ts";
import { VoteModel } from "../db/model.ts";
import type { AuthUser } from "../../auth/jwt.ts";
import type { MyVoteArgs, VoteArgs } from "../types.ts";
import {
  badUserInput,
  conflict,
  notFound,
  unauthenticated,
} from "../../shared/errors.ts";
import { isValidObjectId, normalizeObjectId } from "../../shared/utils.ts";
import { GraphQLError } from "graphql";

const isTransactionNotSupported = (err: unknown): boolean => {
  const error = err as { code?: number; message?: unknown };
  if (error.code === 20) return true;
  if (typeof error.message !== "string") return false;
  return (
    error.message.includes("Transaction numbers are only allowed") ||
    error.message.includes("replica set member") ||
    error.message.includes("replica set")
  );
};

const throwVoteError = (err: unknown): never => {
  if (err instanceof GraphQLError) {
    throw err;
  }
  const error = err as { code?: number; errorLabels?: string[] };
  if (error.code === 11000) {
    throw conflict("You have already voted in this poll");
  }
  if (error.errorLabels?.includes("TransientTransactionError")) {
    throw new GraphQLError("Vote failed, please retry", {
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    });
  }
  throw new GraphQLError("Vote failed", {
    extensions: { code: "INTERNAL_SERVER_ERROR" },
  });
};

const prepareVoteInput = async (
  args: VoteArgs,
  context: { user: AuthUser | null }
) => {
  if (!context.user) {
    throw unauthenticated();
  }
  if (!isValidObjectId(context.user._id)) {
    throw unauthenticated("Invalid user");
  }

  const rawOptionIds = args.input.optionIds ?? [];
  const cleanedOptionIds = rawOptionIds
    .map((id) => id.trim())
    .filter(Boolean);

  if (cleanedOptionIds.length === 0) {
    throw badUserInput("At least one option is required");
  }

  const uniqueOptionIds = Array.from(new Set(cleanedOptionIds));
  if (uniqueOptionIds.length !== cleanedOptionIds.length) {
    throw badUserInput("Duplicate options are not allowed");
  }

  if (!isValidObjectId(args.input.pollId)) {
    throw badUserInput("Invalid poll id");
  }

  const invalidOptionIds = uniqueOptionIds.filter(
    (optionId) => !isValidObjectId(optionId)
  );
  if (invalidOptionIds.length > 0) {
    throw badUserInput("Invalid option id");
  }

  const normalizedPollId = normalizeObjectId(args.input.pollId);
  const normalizedOptionIds = uniqueOptionIds.map(normalizeObjectId);
  if (new Set(normalizedOptionIds).size !== normalizedOptionIds.length) {
    throw badUserInput("Duplicate options are not allowed");
  }

  const poll = await PollModel.findById(normalizedPollId).exec();
  if (!poll) {
    throw notFound("Poll not found");
  }

  const now = new Date();
  if ((poll.status as string) !== "OPEN") {
    throw badUserInput("Poll is closed");
  }
  if (poll.startsAt && now < poll.startsAt) {
    throw badUserInput("Poll has not started");
  }
  if (poll.endsAt && now >= poll.endsAt) {
    if ((poll.status as string) !== "CLOSED") {
      poll.status = "CLOSED";
      poll.closedAt = poll.closedAt ?? now;
      await poll.save();
    }
    throw badUserInput("Poll has ended");
  }

  if (!poll.allowMultiple && normalizedOptionIds.length !== 1) {
    throw badUserInput("Only one option can be selected");
  }

  const pollOptionIds = new Set(
    poll.options.map((option) => normalizeObjectId(option._id.toString()))
  );
  const invalid = normalizedOptionIds.filter(
    (optionId) => !pollOptionIds.has(optionId)
  );
  if (invalid.length > 0) {
    throw badUserInput("Invalid option");
  }

  const optionObjectIds = poll.options
    .filter((option) => normalizedOptionIds.includes(option._id.toString()))
    .map((option) => option._id);

  return {
    poll,
    normalizedOptionIds,
    optionObjectIds,
    userId: context.user._id,
  };
};

export const voteResolvers = {
  Query: {
    myVote: async (
      _parent: unknown,
      args: MyVoteArgs,
      context: { user: AuthUser | null }
    ) => {
      if (!context.user) {
        throw unauthenticated();
      }
      if (!isValidObjectId(context.user._id)) {
        throw unauthenticated("Invalid user");
      }
      if (!isValidObjectId(args.pollId)) {
        throw badUserInput("Invalid poll id");
      }

      return VoteModel.findOne({
        pollId: normalizeObjectId(args.pollId),
        userId: normalizeObjectId(context.user._id),
      }).exec();
    },
  },
  Mutation: {
    vote: async (
      _parent: unknown,
      args: VoteArgs,
      context: { user: AuthUser | null }
    ) => {
      const { poll, normalizedOptionIds, optionObjectIds, userId } =
        await prepareVoteInput(args, context);

      if (mongoose.connection.readyState !== 1) {
        throw new GraphQLError("Database connection not ready", {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }
      const executeVote = async (session?: mongoose.ClientSession) => {
        const [vote] = await VoteModel.create(
          [
            {
              pollId: poll._id,
              userId,
              optionIds: normalizedOptionIds,
            },
          ],
          session ? { session } : undefined
        );

        await PollModel.updateOne(
          { _id: poll._id },
          {
            $inc: {
              totalVotes: normalizedOptionIds.length,
              "options.$[opt].voteCount": 1,
            },
          },
          {
            arrayFilters: [{ "opt._id": { $in: optionObjectIds } }],
            ...(session ? { session } : {}),
          }
        ).exec();

        return vote;
      };

      const session = await mongoose.startSession();
      let startedTransaction = false;
      try {
        try {
          session.startTransaction();
          startedTransaction = true;
        } catch (err) {
          if (!isTransactionNotSupported(err)) {
            throw err;
          }
        }

        if (!startedTransaction) {
          return await executeVote();
        }

        const vote = await executeVote(session);
        await session.commitTransaction();
        return vote;
      } catch (err) {
        if (startedTransaction) {
          await session.abortTransaction();
        }
        if (startedTransaction && isTransactionNotSupported(err)) {
          try {
            return await executeVote();
          } catch (fallbackErr) {
            throwVoteError(fallbackErr);
          }
        }
        throwVoteError(err);
      } finally {
        session.endSession();
      }
    },
    changeVote: async (
      _parent: unknown,
      args: VoteArgs,
      context: { user: AuthUser | null }
    ) => {
      const { poll, normalizedOptionIds, userId } = await prepareVoteInput(
        args,
        context
      );

      if (mongoose.connection.readyState !== 1) {
        throw new GraphQLError("Database connection not ready", {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      const existingVote = await VoteModel.findOne({
        pollId: poll._id,
        userId,
      }).exec();

      if (!existingVote) {
        throw badUserInput("You have not voted in this poll yet");
      }

      const oldOptionIds = existingVote.optionIds.map((id) =>
        normalizeObjectId(id.toString())
      );
      const oldSet = new Set(oldOptionIds);
      const newSet = new Set(normalizedOptionIds);
      const isSameSelection =
        oldOptionIds.length === normalizedOptionIds.length &&
        normalizedOptionIds.every((id) => oldSet.has(id));

      if (isSameSelection) {
        return existingVote;
      }

      const toAdd = normalizedOptionIds.filter((id) => !oldSet.has(id));
      const toRemove = oldOptionIds.filter((id) => !newSet.has(id));
      const totalVotesDelta = normalizedOptionIds.length - oldOptionIds.length;

      const optionIdMap = new Map(
        poll.options.map((option) => [
          normalizeObjectId(option._id.toString()),
          option._id,
        ])
      );
      const addObjectIds = toAdd
        .map((id) => optionIdMap.get(id))
        .filter((value): value is mongoose.Types.ObjectId => Boolean(value));
      const removeObjectIds = toRemove
        .map((id) => optionIdMap.get(id))
        .filter((value): value is mongoose.Types.ObjectId => Boolean(value));

      const executeChangeVote = async (session?: mongoose.ClientSession) => {
        existingVote.optionIds = normalizedOptionIds.map(
          (id) => new mongoose.Types.ObjectId(id)
        );
        await existingVote.save(session ? { session } : undefined);

        const inc: Record<string, number> = {};
        const arrayFilters: Record<string, unknown>[] = [];

        if (addObjectIds.length > 0) {
          inc["options.$[add].voteCount"] = 1;
          arrayFilters.push({ "add._id": { $in: addObjectIds } });
        }
        if (removeObjectIds.length > 0) {
          inc["options.$[rem].voteCount"] = -1;
          arrayFilters.push({ "rem._id": { $in: removeObjectIds } });
        }
        if (totalVotesDelta !== 0) {
          inc.totalVotes = totalVotesDelta;
        }

        if (Object.keys(inc).length > 0) {
          const updateOptions: Record<string, unknown> = {};
          if (arrayFilters.length > 0) {
            updateOptions.arrayFilters = arrayFilters;
          }
          if (session) {
            updateOptions.session = session;
          }

          await PollModel.updateOne(
            { _id: poll._id },
            { $inc: inc },
            updateOptions
          ).exec();
        }

        return existingVote;
      };

      const session = await mongoose.startSession();
      let startedTransaction = false;
      try {
        try {
          session.startTransaction();
          startedTransaction = true;
        } catch (err) {
          if (!isTransactionNotSupported(err)) {
            throw err;
          }
        }

        if (!startedTransaction) {
          return await executeChangeVote();
        }

        const updatedVote = await executeChangeVote(session);
        await session.commitTransaction();
        return updatedVote;
      } catch (err) {
        if (startedTransaction) {
          await session.abortTransaction();
        }
        if (startedTransaction && isTransactionNotSupported(err)) {
          try {
            return await executeChangeVote();
          } catch (fallbackErr) {
            throwVoteError(fallbackErr);
          }
        }
        throwVoteError(err);
      } finally {
        session.endSession();
      }
    },
  },
};
