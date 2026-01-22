import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  CHANGE_VOTE_MUTATION,
  CLOSE_POLL_MUTATION,
  DELETE_POLL_MUTATION,
  MY_VOTE_QUERY,
  POLL_OPTION_VOTERS_QUERY,
  VOTE_MUTATION,
} from "../../graphql/operations";
import type {
  ChangeVoteData,
  ChangeVoteVars,
  ClosePollData,
  ClosePollVars,
  DeletePollData,
  DeletePollVars,
  MyVoteData,
  MyVoteVars,
  PollOptionVotersData,
  PollOptionVotersVars,
  VoteData,
  VoteVars,
} from "../../types";
import type { ActivePoll } from "./types";
import { VotersModal } from "./VotersModal";

type PollResultsCardProps = {
  poll: ActivePoll | null;
  currentUserId: string | null;
  onPollUpdated: () => Promise<unknown> | void;
};

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

const isPollClosed = (poll: ActivePoll) => {
  if (poll.status === "CLOSED") return true;
  if (poll.endsAt && new Date(poll.endsAt).getTime() <= Date.now()) {
    return true;
  }
  return false;
};

export const PollResultsCard = ({
  poll,
  currentUserId,
  onPollUpdated,
}: PollResultsCardProps) => {
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [votersOptionId, setVotersOptionId] = useState<string | null>(null);
  const [votersPage, setVotersPage] = useState(1);
  const [isEditingVote, setEditingVote] = useState(false);
  const votersPageSize = 10;

  const [vote, { loading: voteLoading }] = useMutation<VoteData, VoteVars>(
    VOTE_MUTATION,
  );
  const [changeVote, { loading: changeVoteLoading }] = useMutation<
    ChangeVoteData,
    ChangeVoteVars
  >(CHANGE_VOTE_MUTATION);
  const [closePoll, { loading: closeLoading }] = useMutation<
    ClosePollData,
    ClosePollVars
  >(CLOSE_POLL_MUTATION);
  const [deletePoll, { loading: deleteLoading }] = useMutation<
    DeletePollData,
    DeletePollVars
  >(DELETE_POLL_MUTATION);

  const {
    data: myVoteData,
    loading: myVoteLoading,
    refetch: refetchMyVote,
  } = useQuery<MyVoteData, MyVoteVars>(MY_VOTE_QUERY, {
    skip: !poll || !currentUserId,
    variables: { pollId: poll?.id ?? "" },
  });

  const { data: votersData, loading: votersLoading, error: votersError } =
    useQuery<PollOptionVotersData, PollOptionVotersVars>(
      POLL_OPTION_VOTERS_QUERY,
      {
        skip:
          !poll || !currentUserId || !votersOptionId || poll.anonymousVoting,
        variables: {
          input: {
            pollId: poll?.id ?? "",
            optionId: votersOptionId ?? "",
            page: votersPage,
            pageSize: votersPageSize,
          },
        },
      },
    );

  useEffect(() => {
    setSelectedOptionIds([]);
    setVoteError(null);
    setActionError(null);
    setVotersOptionId(null);
    setVotersPage(1);
    setEditingVote(false);
  }, [poll?.id]);

  useEffect(() => {
    if (myVoteData?.myVote?.optionIds) {
      setSelectedOptionIds(myVoteData.myVote.optionIds);
    }
  }, [myVoteData?.myVote?.optionIds]);

  useEffect(() => {
    setVotersPage(1);
  }, [votersOptionId]);

  const hasVoted = Boolean(myVoteData?.myVote);
  const pollIsClosed = poll ? isPollClosed(poll) : false;
  const canVote =
    Boolean(poll) &&
    Boolean(currentUserId) &&
    !myVoteLoading &&
    (!hasVoted || isEditingVote) &&
    !pollIsClosed;
  const canViewVoters = Boolean(currentUserId) && poll && !poll.anonymousVoting;
  const canClosePoll =
    Boolean(currentUserId) &&
    poll &&
    poll.createdBy === currentUserId &&
    !pollIsClosed;
  const canDeletePoll = Boolean(currentUserId) && poll && pollIsClosed;
  const submitLoading = voteLoading || changeVoteLoading;
  const votersPageData = votersData?.pollOptionVoters;
  const voters = votersPageData?.items ?? [];
  const votersTotalPages = votersPageData?.totalPages ?? 1;
  const votersTotalCount = votersPageData?.totalCount ?? 0;

  const handleOptionToggle = (optionId: string) => {
    if (!poll || !canVote) return;

    setSelectedOptionIds((prev) => {
      if (poll.allowMultiple) {
        return prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId];
      }
      return [optionId];
    });
  };

  const handleVote = async () => {
    if (!poll) return;
    setVoteError(null);

    if (isPollClosed(poll)) {
      setVoteError("Voting is closed for this poll.");
      return;
    }

    if (selectedOptionIds.length === 0) {
      setVoteError("Pick at least one option.");
      return;
    }

    try {
      if (hasVoted) {
        await changeVote({
          variables: {
            input: { pollId: poll.id, optionIds: selectedOptionIds },
          },
        });
      } else {
        await vote({
          variables: {
            input: { pollId: poll.id, optionIds: selectedOptionIds },
          },
        });
      }
      setSelectedOptionIds([]);
      setEditingVote(false);
      await Promise.all([onPollUpdated(), refetchMyVote()]);
    } catch (err) {
      setVoteError(err instanceof Error ? err.message : "Vote failed");
    }
  };

  const handleOpenVoters = (optionId: string) => {
    if (!poll || poll.anonymousVoting || !currentUserId) {
      return;
    }

    setActionError(null);
    setVotersOptionId(optionId);
  };

  const handleCloseVoters = () => {
    setVotersOptionId(null);
  };

  const handleClosePoll = async () => {
    if (!poll) return;
    setActionError(null);

    try {
      await closePoll({ variables: { id: poll.id } });
      await onPollUpdated();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Close failed");
    }
  };

  const handleDeletePoll = async () => {
    if (!poll) return;
    setActionError(null);

    const confirmed = window.confirm(
      "Delete this poll? This cannot be undone.",
    );
    if (!confirmed) {
      return;
    }

    try {
      await deletePoll({ variables: { id: poll.id } });
      await onPollUpdated();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleStartEdit = () => {
    if (!hasVoted || pollIsClosed) return;
    setEditingVote(true);
  };

  const handleCancelEdit = () => {
    setEditingVote(false);
    if (myVoteData?.myVote?.optionIds) {
      setSelectedOptionIds(myVoteData.myVote.optionIds);
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-ink-900">
          {poll && isPollClosed(poll) ? (
            "Poll is closed"
          ) : (
            <span className="text-accent">Live Poll</span>
          )}
        </h2>
        <span className="rounded-full bg-surface-alt px-3 py-1 text-xs font-semibold text-ink-500">
          Results
        </span>
      </div>

      {!poll && (
        <div className="mt-6 text-sm text-ink-700">
          No poll yet. Create one to see results here.
        </div>
      )}

      {poll && (
        <div className="mt-6 space-y-4">
          {isPollClosed(poll) && (
            <p className="text-sm text-ink-500">
              Voting is closed for this poll.
            </p>
          )}
          <div>
            <h3 className="text-lg font-semibold text-ink-900">{poll.title}</h3>
            {poll.description && (
              <p className="mt-1 text-sm text-ink-700">{poll.description}</p>
            )}
            <p className="text-sm font-semibold text-accent">
              {poll.totalVotes} votes total
            </p>
            {poll.anonymousVoting && (
              <p className="text-xs text-ink-500">
                Anonymous poll. Voter identities are hidden.
              </p>
            )}
          </div>

          <div className="space-y-3">
            {poll.options.map((option) => {
              const totalVotes = poll.totalVotes || 0;
              const percent =
                totalVotes > 0 ? (option.voteCount / totalVotes) * 100 : 0;
              const isSelected = selectedOptionIds.includes(option.id);
              const isViewingVoters = votersOptionId === option.id;

              return (
                <div
                  key={option.id}
                  className={`rounded-xl border px-4 py-3 transition ${
                    isSelected
                      ? "border-accent/70 bg-white"
                      : "border-ink-500/15 bg-white/70"
                  } ${!canVote ? "opacity-80" : ""}`}
                >
                  <label
                    className={`flex items-center gap-3 ${
                      canVote ? "cursor-pointer" : "cursor-default"
                    }`}
                  >
                    <input
                      type={poll.allowMultiple ? "checkbox" : "radio"}
                      checked={isSelected}
                      onChange={() => handleOptionToggle(option.id)}
                      disabled={!canVote}
                      className="h-4 w-4 accent-[color:var(--accent)]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm font-medium text-ink-900">
                        <span>{option.text}</span>
                        <span>{Math.round(percent)}%</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-surface-alt">
                        <div
                          className="h-2 rounded-full bg-accent"
                          style={{ width: `${clampPercent(percent)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-ink-500">
                        {option.voteCount} votes
                      </p>
                    </div>
                  </label>

                  {canViewVoters && (
                    <button
                      className="mt-2 text-xs font-semibold text-ink-500 underline underline-offset-4"
                      type="button"
                      onClick={() => handleOpenVoters(option.id)}
                    >
                      {isViewingVoters
                        ? "Viewing voters"
                        : `View voters (${option.voteCount})`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {!currentUserId && (
            <p className="text-sm text-ink-500">Sign in to vote.</p>
          )}
          {hasVoted && !isEditingVote && !myVoteLoading && (
            <p className="text-sm text-ink-500">You already voted.</p>
          )}
          {voteError && <p className="text-sm text-red-600">{voteError}</p>}
          {actionError && <p className="text-sm text-red-600">{actionError}</p>}

          <div className="flex flex-wrap items-center gap-3">
            <button
              className="primary-button"
              type="button"
              onClick={handleVote}
              disabled={
                !selectedOptionIds.length ||
                submitLoading ||
                !canVote ||
                myVoteLoading
              }
            >
              {submitLoading
                ? "Submitting..."
                : hasVoted
                  ? "Update vote"
                  : "Vote"}
            </button>

            {hasVoted && !pollIsClosed && !isEditingVote && (
              <button
                className="ghost-button"
                type="button"
                onClick={handleStartEdit}
              >
                Change vote
              </button>
            )}

            {isEditingVote && (
              <button
                className="ghost-button"
                type="button"
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
            )}

            {canClosePoll && (
              <button
                className="ghost-button"
                type="button"
                onClick={handleClosePoll}
                disabled={closeLoading}
              >
                {closeLoading ? "Closing..." : "Close Poll"}
              </button>
            )}

            {canDeletePoll && (
              <button
                className="ghost-button"
                type="button"
                onClick={handleDeletePoll}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting..." : "Delete Poll"}
              </button>
            )}
          </div>
        </div>
      )}

      {poll && (
        <VotersModal
          open={Boolean(votersOptionId)}
          optionLabel={
            poll.options.find((option) => option.id === votersOptionId)?.text ??
            "Option"
          }
          voters={voters}
          loading={votersLoading}
          error={votersError?.message}
          page={votersPage}
          totalPages={votersTotalPages}
          totalCount={votersTotalCount}
          onClose={handleCloseVoters}
          onPageChange={setVotersPage}
        />
      )}
    </div>
  );
};
