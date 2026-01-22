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
