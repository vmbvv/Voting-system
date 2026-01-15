import { scalarResolvers } from "./scalars.ts";
import { pollResolvers } from "../polls/graphql/resolvers.ts";
import { userResolvers } from "../users/graphql/resolvers.ts";

export const resolvers = {
  ...scalarResolvers,
  Query: {
    health: () => "ok",
    ...pollResolvers.Query,
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...pollResolvers.Mutation,
  },
};
