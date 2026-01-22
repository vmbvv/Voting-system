export type CreatePollOptionInput = {
  text: string;
};

export type CreatePollInput = {
  title: string;
  description?: string | null;
  options: CreatePollOptionInput[];
  startsAt?: Date | null;
  endsAt?: Date | null;
  allowMultiple?: boolean | null;
  anonymousVoting?: boolean | null;
};

export type CreatePollArgs = {
  input: CreatePollInput;
};

export type PollArgs = {
  id: string;
};

export type PollResultsArgs = {
  pollId: string;
};

export type PollOptionVotersInput = {
  pollId: string;
  optionId: string;
  page?: number | null;
  pageSize?: number | null;
};

export type PollOptionVotersArgs = {
  input: PollOptionVotersInput;
};

export type PollOptionDoc = {
  _id: { toString(): string };
  text: string;
  voteCount: number;
};

export type PollSortField = "CREATED_AT";

export type SortOrder = "ASC" | "DESC";

export type PollSortInput = {
  field?: PollSortField | null;
  order?: SortOrder | null;
};

export type PollsInput = {
  status?: "OPEN" | "CLOSED" | null;
  search?: string | null;
  sort?: PollSortInput | null;
  page?: number | null;
  pageSize?: number | null;
};

export type PollsArgs = {
  input?: PollsInput | null;
};
