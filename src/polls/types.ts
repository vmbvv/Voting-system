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

export type PollOptionDoc = {
  _id: { toString(): string };
  text: string;
  voteCount: number;
};
