import { scalarResolvers } from "./scalars.ts";

export const resolvers = {
  ...scalarResolvers,
  Query: {
    health: () => "ok",
  },
  Mutation: {},
};
