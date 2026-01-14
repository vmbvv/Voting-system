import { scalarTypeDefs } from "./scalars.js";
import { pollTypeDefs } from "../polls/graphql/schema.js";
import { voteTypeDefs } from "../votes/graphql/schema.js";

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
  baseTypeDefs,
  pollTypeDefs,
  voteTypeDefs,
];
