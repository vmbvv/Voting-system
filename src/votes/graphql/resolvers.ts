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

      const session = await mongoose.startSession();
      try {
        try {
          session.startTransaction();
        } catch (err) {
          throw new GraphQLError(
            "Transactions require a replica set (MongoDB Atlas is supported)",
            { extensions: { code: "INTERNAL_SERVER_ERROR" } }
          );
        }

        const [vote] = await VoteModel.create(
          [
            {
              pollId: poll._id,
              userId: context.user._id,
              optionIds: normalizedOptionIds,
            },
          ],
          { session }
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
            session,
          }
        ).exec();

        await session.commitTransaction();
        return vote;
      } catch (err) {
        await session.abortTransaction();
        if (err instanceof GraphQLError) {
          throw err;
        }
        const error = err as { code?: number };
        if (error.code === 11000) {
          throw conflict("You have already voted in this poll");
        }
        if ((error as { errorLabels?: string[] }).errorLabels?.includes("TransientTransactionError")) {
          throw new GraphQLError("Vote failed, please retry", {
            extensions: { code: "INTERNAL_SERVER_ERROR" },
          });
        }
        throw new GraphQLError("Vote failed", {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      } finally {
        session.endSession();
      }
    },
  },
};
