import mongoose from "mongoose";
import { PollModel } from "../../polls/db/model.ts";
import { VoteModel } from "../db/model.ts";
import type { AuthUser } from "../../auth/jwt.ts";
import type { VoteArgs } from "../types.ts";
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

export const voteResolvers = {
  Mutation: {
    vote: async (
      _parent: unknown,
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

      if (!poll.allowMultiple && uniqueOptionIds.length !== 1) {
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
        .filter((option) =>
          normalizedOptionIds.includes(option._id.toString())
        )
        .map((option) => option._id);

      if (mongoose.connection.readyState !== 1) {
        throw new GraphQLError("Database connection not ready", {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      const userId = context.user._id;
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
  },
};
