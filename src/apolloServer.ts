import { GraphQLScalarType, Kind } from "graphql";
import { Query } from "mongoose";

export const typeDefs = `


type Query {
}

type Mutation {

}
`;

const coerceDate = (value: unknown): Date => {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new TypeError("Invalid DateTime value");
    }
    return value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new TypeError("Invalid DateTime value");
    }
    return date;
  }

  throw new TypeError("DateTime must be a Date, string, or number");
};

const DateTimeScalar = new GraphQLScalarType({
  name: "DateTime",
  description: "ISO-8601 DateTime string",
  serialize(value) {
    return coerceDate(value).toISOString();
  },
  parseValue(value) {
    return coerceDate(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING || ast.kind === Kind.INT) {
      return coerceDate(ast.value);
    }
    throw new TypeError("DateTime must be a string or integer");
  },
});

export const resolvers = {
  Query: {},
  Mutation: {},
};
