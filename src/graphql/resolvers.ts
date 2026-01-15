import { scalarResolvers } from "./scalars.ts";
import { pollResolvers } from "../polls/graphql/resolvers.ts";
import { userResolvers } from "../users/graphql/resolvers.ts";
import { voteResolvers } from "../votes/graphql/resolvers.ts";

export const resolvers = {
  ...scalarResolvers,
  Query: {
    health: () => "ok",
    ...userResolvers.Query,
    ...pollResolvers.Query,
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...pollResolvers.Mutation,
    ...voteResolvers.Mutation,
  },
};
