import { scalarTypeDefs } from "./scalars.ts";
import { pollTypeDefs } from "../polls/graphql/schema.ts";
import { voteTypeDefs } from "../votes/graphql/schema.ts";

const baseTypeDefs = `
type Query {
  health: String!
  poll(id: ID!): Poll
  pollResults(pollId: ID!): PollResults!
}

type Mutation {
  createPoll(input: CreatePollInput!): Poll!
  vote(input: VoteInput!): Vote!
}
`;

export const typeDefs = [
  scalarTypeDefs,
  pollTypeDefs,
  voteTypeDefs,
  baseTypeDefs,
];
