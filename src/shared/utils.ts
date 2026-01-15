import { Types } from "mongoose";

export const isValidObjectId = (value: string): boolean =>
  Types.ObjectId.isValid(value);
