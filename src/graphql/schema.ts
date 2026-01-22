import { scalarTypeDefs } from "./scalars.ts";
import { pollTypeDefs } from "../polls/graphql/schema.ts";
import { voteTypeDefs } from "../votes/graphql/schema.ts";
import { userTypeDefs } from "../users/graphql/schema.ts";

const baseTypeDefs = `
type Query {
  health: String!
  me: User
  poll(id: ID!): Poll
  pollResults(pollId: ID!): PollResults
  polls(input: PollsInput): PollPage!
  pollOptionVoters(input: PollOptionVotersInput!): VoterPage!
  myVote(pollId: ID!): Vote
}

type Mutation {
  register(input: RegisterInput!): AuthPayload!
  login(input: LoginInput!): AuthPayload!
  logout: Boolean!
  createPoll(input: CreatePollInput!): Poll!
  vote(input: VoteInput!): Vote!
  changeVote(input: VoteInput!): Vote!
  closePoll(id: ID!): Poll!
  deletePoll(id: ID!): Boolean!
}
`;

export const typeDefs = [
  scalarTypeDefs,
  pollTypeDefs,
  voteTypeDefs,
  userTypeDefs,
  baseTypeDefs,
];
