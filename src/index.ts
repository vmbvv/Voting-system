import dotenv from "dotenv";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import mongoose from "mongoose";
import { typeDefs, resolvers } from "./apolloServer.ts";
import { type AuthUser, getUserFromAuthHeader } from "./auth/jwt.ts";

dotenv.config({ override: true, quiet: true });

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  throw new Error("Missing `MONGODB_URI` in environment (.env).");
}

await mongoose.connect(mongoUri);
console.log("MongoDB connected!");

export interface IContext {
  user: AuthUser | null;
}

const server = new ApolloServer<IContext>({
  typeDefs,
  resolvers,
});

const portFromEnv = process.env.PORT ? Number(process.env.PORT) : NaN;
const port = Number.isFinite(portFromEnv) ? portFromEnv : 4000;

const { url } = await startStandaloneServer(server, {
  listen: { port },
  context: async ({ req, res }) => {
    const user = getUserFromAuthHeader(req.headers.authorization);
    return {
      user,
    };
  },
});

console.log(`Server ready at: ${url}`);
