export const voteTypeDefs = `
type Vote {
  id: ID!
  pollId: ID!
  optionIds: [ID!]!
  userId: ID!
  createdAt: DateTime!
}

input VoteInput {
  pollId: ID!
  optionIds: [ID!]!
}
`;
