export const voteTypeDefs = `
type Vote {
id: ID!
pollId: ID!
optionId: ID!
userId: ID!
createdAt: DateTime!
}


input VoteInput {
pollId: ID!
optionId: ID!
}
`;
