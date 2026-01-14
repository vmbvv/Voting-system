import { GraphQLScalarType, Kind } from "graphql";

export const typeDefs = `
type Query {
  health: String!
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
    switch (ast.kind) {
      case Kind.INT: {
        const n = Number(ast.value);
        if (!Number.isFinite(n)) return null;
        return coerceDate(n);
      }

      case Kind.STRING:
        return coerceDate(ast.value);

      default:
        return null;
    }
  },
});

export const resolvers = {
  Query: {
    health: () => "ok",
  },
  Mutation: {},
};
