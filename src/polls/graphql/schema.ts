export const pollTypeDefs = `
enum PollStatus {
  OPEN
  CLOSED
}

enum PollSortField {
  CREATED_AT
}

enum SortOrder {
  ASC
  DESC
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

type VoterPage {
  items: [User!]!
  page: Int!
  pageSize: Int!
  totalCount: Int!
  totalPages: Int!
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
}

type PollPage {
  items: [Poll!]!
  page: Int!
  pageSize: Int!
  totalCount: Int!
  totalPages: Int!
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
}

input PollSortInput {
  field: PollSortField = CREATED_AT
  order: SortOrder = DESC
}

input PollsInput {
  status: PollStatus
  search: String
  sort: PollSortInput
  page: Int = 1
  pageSize: Int = 5
}

input PollOptionVotersInput {
  pollId: ID!
  optionId: ID!
  page: Int = 1
  pageSize: Int = 20
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
  allowMultiple: Boolean
  anonymousVoting: Boolean
}
`;
