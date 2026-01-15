import { scalarResolvers } from "./scalars.ts";
import { pollResolvers } from "../polls/graphql/resolvers.ts";

export const resolvers = {
  ...scalarResolvers,
  Query: {
    health: () => "ok",
    ...pollResolvers.Query,
  },
  Mutation: {
    ...pollResolvers.Mutation,
  },
};
