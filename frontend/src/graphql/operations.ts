import { gql } from "@apollo/client";

export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      name
    }
  }
`;

export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        id
        email
        name
      }
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        email
        name
      }
    }
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

export const CREATE_POLL_MUTATION = gql`
  mutation CreatePoll($input: CreatePollInput!) {
    createPoll(input: $input) {
      id
      title
      description
      allowMultiple
      anonymousVoting
      options {
        id
        text
        voteCount
      }
    }
  }
`;

export const POLL_RESULTS_QUERY = gql`
  query PollResults($pollId: ID!) {
    pollResults(pollId: $pollId) {
      pollId
      totalVotes
      options {
        optionId
        text
        voteCount
        percent
      }
    }
  }
`;

export const VOTE_MUTATION = gql`
  mutation Vote($input: VoteInput!) {
    vote(input: $input) {
      id
      pollId
      optionIds
    }
  }
`;

export const CHANGE_VOTE_MUTATION = gql`
  mutation ChangeVote($input: VoteInput!) {
    changeVote(input: $input) {
      id
      pollId
      optionIds
    }
  }
`;

export const POLLS_QUERY = gql`
  query Polls($input: PollsInput) {
    polls(input: $input) {
      items {
        id
        title
        description
        createdBy
        status
        startsAt
        endsAt
        closedAt
        allowMultiple
        anonymousVoting
        totalVotes
        options {
          id
          text
          voteCount
        }
      }
      page
      pageSize
      totalCount
      totalPages
      hasNextPage
      hasPreviousPage
    }
  }
`;

export const POLL_OPTION_VOTERS_QUERY = gql`
  query PollOptionVoters($input: PollOptionVotersInput!) {
    pollOptionVoters(input: $input) {
      items {
        id
        email
        name
      }
      page
      pageSize
      totalCount
      totalPages
      hasNextPage
      hasPreviousPage
    }
  }
`;

export const MY_VOTE_QUERY = gql`
  query MyVote($pollId: ID!) {
    myVote(pollId: $pollId) {
      id
      pollId
      optionIds
    }
  }
`;

export const CLOSE_POLL_MUTATION = gql`
  mutation ClosePoll($id: ID!) {
    closePoll(id: $id) {
      id
      status
      closedAt
    }
  }
`;

export const DELETE_POLL_MUTATION = gql`
  mutation DeletePoll($id: ID!) {
    deletePoll(id: $id)
  }
`;
