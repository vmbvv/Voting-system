export type VoteInput = {
  pollId: string;
  optionIds: string[];
};

export type VoteArgs = {
  input: VoteInput;
};
