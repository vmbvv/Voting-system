import { GraphQLError } from "graphql";

export type ErrorCode =
  | "BAD_USER_INPUT"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_SERVER_ERROR";

export const gqlError = (message: string, code: ErrorCode): GraphQLError =>
  new GraphQLError(message, { extensions: { code } });

export const badUserInput = (message: string): GraphQLError =>
  gqlError(message, "BAD_USER_INPUT");

export const unauthenticated = (
  message = "Authentication required"
): GraphQLError => gqlError(message, "UNAUTHENTICATED");

export const forbidden = (message = "Forbidden"): GraphQLError =>
  gqlError(message, "FORBIDDEN");

export const notFound = (message = "Not found"): GraphQLError =>
  gqlError(message, "NOT_FOUND");

export const conflict = (message = "Conflict"): GraphQLError =>
  gqlError(message, "CONFLICT");
