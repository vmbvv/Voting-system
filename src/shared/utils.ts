import { Types } from "mongoose";

export const isValidObjectId = (value: string): boolean =>
  Types.ObjectId.isValid(value);

export const normalizeObjectId = (value: string): string =>
  new Types.ObjectId(value).toString();
