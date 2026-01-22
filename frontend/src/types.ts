export type User = {
  id: string;
  email: string;
  name?: string | null;
};

export type AuthPayload = {
  token: string;
  user: User;
};

export type MeData = {
  me: User | null;
};

export type RegisterVars = {
  input: {
    email: string;
    password: string;
    confirmPassword: string;
    name?: string | null;
  };
};

export type RegisterData = {
  register: AuthPayload;
};

export type LoginVars = {
  input: {
    email: string;
    password: string;
  };
};

export type LoginData = {
  login: AuthPayload;
};

export type CreatePollVars = {
  input: {
    title: string;
    description?: string | null;
    options: { text: string }[];
    startsAt?: string | null;
    endsAt?: string | null;
    allowMultiple?: boolean | null;
    anonymousVoting?: boolean | null;
  };
};

export type CreatePollData = {
  createPoll: {
    id: string;
    title: string;
    description?: string | null;
    allowMultiple: boolean;
    anonymousVoting: boolean;
    options: { id: string; text: string; voteCount: number }[];
  };
};

export type PollResultsVars = {
  pollId: string;
};

export type PollResultsData = {
  pollResults: {
    pollId: string;
    totalVotes: number;
    options: {
      optionId: string;
      text: string;
      voteCount: number;
      percent: number;
    }[];
  } | null;
};

export type VoteVars = {
  input: {
    pollId: string;
    optionIds: string[];
  };
};

export type VoteData = {
  vote: {
    id: string;
    pollId: string;
    optionIds: string[];
  };
};
