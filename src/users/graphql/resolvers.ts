import bcrypt from "bcryptjs";
import { UserModel } from "../db/model.ts";
import { signToken, type AuthUser } from "../../auth/jwt.ts";
import type { LoginArgs, RegisterArgs } from "../types.ts";

export const userResolvers = {
  Mutation: {
    register: async (_parent: unknown, args: RegisterArgs) => {
      const email = args.input.email?.trim().toLowerCase();
      const password = args.input.password;
      const confirmPassword = args.input.confirmPassword;
      const name = args.input.name?.trim();

      if (!email) {
        throw new Error("Email is required");
      }

      if (!password || password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      const existing = await UserModel.findOne({ email }).exec();
      if (existing) {
        throw new Error("Email is already in use");
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
        throw new Error("Invalid credentials");
      }

      const user = await UserModel.findOne({ email }).exec();
      if (!user) {
        throw new Error("Invalid credentials");
      }

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) {
        throw new Error("Invalid credentials");
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
