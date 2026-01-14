export const pollTypeDefs = `
enum PollStatus {
  OPEN
  CLOSED
}

type PollOption {
  id: ID!
  text: String!
  voteCount: Int!
}

type Poll {
  id: ID!
  title: String!
  description: String
  createdBy: ID!
  status: PollStatus!
  startsAt: DateTime
  endsAt: DateTime
  closedAt: DateTime
  allowMultiple: Boolean!
  anonymousVoting: Boolean!
  options: [PollOption!]!
  totalVotes: Int!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type PollResultOption {
  optionId: ID!
  text: String!
  voteCount: Int!
  percent: Float!
}

type PollResults {
  pollId: ID!
  totalVotes: Int!
  options: [PollResultOption!]!
}

input CreatePollOptionInput {
  text: String!
}

input CreatePollInput {
  title: String!
  description: String
  options: [CreatePollOptionInput!]!
  startsAt: DateTime
  endsAt: DateTime
  allowMultiple: Boolean!
  anonymousVoting: Boolean!
}
`;
