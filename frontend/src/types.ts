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

export type LogoutData = {
  logout: boolean;
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

export type ChangeVoteVars = VoteVars;

export type ChangeVoteData = {
  changeVote: {
    id: string;
    pollId: string;
    optionIds: string[];
  };
};

export type Poll = {
  id: string;
  title: string;
  description?: string | null;
  createdBy: string;
  status: "OPEN" | "CLOSED";
  startsAt?: string | null;
  endsAt?: string | null;
  closedAt?: string | null;
  allowMultiple: boolean;
  anonymousVoting: boolean;
  options: { id: string; text: string; voteCount: number }[];
  totalVotes: number;
};

export type PollPage = {
  items: Poll[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PollsVars = {
  input?: {
    status?: "OPEN" | "CLOSED" | null;
    search?: string | null;
    sort?: {
      field?: "CREATED_AT" | null;
      order?: "ASC" | "DESC" | null;
    } | null;
    page?: number | null;
    pageSize?: number | null;
  } | null;
};

export type PollsData = {
  polls: PollPage;
};

export type PollOptionVotersVars = {
  input: {
    pollId: string;
    optionId: string;
    page?: number | null;
    pageSize?: number | null;
  };
};

export type PollOptionVotersData = {
  pollOptionVoters: {
    items: User[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export type MyVoteVars = {
  pollId: string;
};

export type MyVoteData = {
  myVote: {
    id: string;
    pollId: string;
    optionIds: string[];
  } | null;
};

export type ClosePollVars = {
  id: string;
};

export type ClosePollData = {
  closePoll: Poll;
};

export type DeletePollVars = {
  id: string;
};

export type DeletePollData = {
  deletePoll: boolean;
};
