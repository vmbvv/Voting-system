import bcrypt from "bcryptjs";
import { UserModel } from "../db/model.ts";
import { signToken, type AuthUser } from "../../auth/jwt.ts";
import { badUserInput, conflict, unauthenticated } from "../../shared/errors.ts";
import type { LoginArgs, RegisterArgs } from "../types.ts";

export const userResolvers = {
  Query: {
    me: async (
      _parent: unknown,
      _args: Record<string, never>,
      context: { user: AuthUser | null }
    ) => {
      if (!context.user) return null;
      return UserModel.findById(context.user._id).exec();
    },
  },
  Mutation: {
    register: async (_parent: unknown, args: RegisterArgs) => {
      const email = args.input.email?.trim().toLowerCase();
      const password = args.input.password;
      const confirmPassword = args.input.confirmPassword;
      const name = args.input.name?.trim();

      if (!email) {
        throw badUserInput("Email is required");
      }

      if (!password || password.length < 6) {
        throw badUserInput("Password must be at least 6 characters");
      }

      if (password !== confirmPassword) {
        throw badUserInput("Passwords do not match");
      }

      const existing = await UserModel.findOne({ email }).exec();
      if (existing) {
        throw conflict("Email is already in use");
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await UserModel.create({
        email,
        passwordHash,
        ...(name ? { name } : {}),
      });

      const authUser: AuthUser = {
        _id: user._id.toString(),
        email: user.email,
      };
      if (user.name) {
        authUser.name = user.name;
      }

      const token = signToken(authUser);

      return { token, user };
    },

    login: async (_parent: unknown, args: LoginArgs) => {
      const email = args.input.email?.trim().toLowerCase();
      const password = args.input.password;

      if (!email || !password) {
        throw unauthenticated("Invalid credentials");
      }

      const user = await UserModel.findOne({ email }).exec();
      if (!user) {
        throw unauthenticated("Invalid credentials");
      }

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) {
        throw unauthenticated("Invalid credentials");
      }

      const authUser: AuthUser = {
        _id: user._id.toString(),
        email: user.email,
      };
      if (user.name) {
        authUser.name = user.name;
      }

      const token = signToken(authUser);

      return { token, user };
    },
  },
};
