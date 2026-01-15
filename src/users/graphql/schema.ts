export const userTypeDefs = `
type User {
  id: ID!
  email: String!
  name: String
  createdAt: DateTime!
  updatedAt: DateTime!
}

type AuthPayload {
  token: String!
  user: User!
}

input RegisterInput {
  email: String!
  password: String!
  confirmPassword: String!
  name: String
}

input LoginInput {
  email: String!
  password: String!
}
`;
