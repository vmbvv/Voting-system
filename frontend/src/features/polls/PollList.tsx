import type { Poll } from "../../types";

type PollListProps = {
  polls: Poll[];
  activePollId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
  statusFilter: "ALL" | "OPEN" | "CLOSED";
  sortOrder: "DESC" | "ASC";
  search: string;
  page: number;
  totalPages: number;
  totalCount: number;
  onStatusChange: (value: "ALL" | "OPEN" | "CLOSED") => void;
  onSortChange: (value: "DESC" | "ASC") => void;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
};

const formatTimeLeft = (endsAt?: string | null) => {
  if (!endsAt) return "No end";
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "Closed";
  const hours = Math.ceil(diff / (1000 * 60 * 60));
  if (hours < 24) return `${hours}h left`;
  const days = Math.ceil(hours / 24);
  return `${days}d left`;
};

const isClosed = (poll: Poll) => {
  if (poll.status === "CLOSED") return true;
  if (poll.endsAt && new Date(poll.endsAt).getTime() <= Date.now()) return true;
  return false;
};

const getClosedSummary = (poll: Poll) => {
  if (!isClosed(poll)) return null;
  if (poll.totalVotes === 0) return "No votes yet";
  const maxVotes = Math.max(...poll.options.map((option) => option.voteCount));
  const winners = poll.options.filter((option) => option.voteCount === maxVotes);
  const percent =
    poll.totalVotes > 0 ? Math.round((maxVotes / poll.totalVotes) * 100) : 0;

  if (winners.length > 1) {
    return `Result was a draw (${percent}%)`;
  }

  return `Winning: ${winners[0].text} (${percent}%)`;
};

export const PollList = ({
  polls,
  activePollId,
  onSelect,
  loading = false,
  statusFilter,
  sortOrder,
  search,
  page,
  totalPages,
  totalCount,
  onStatusChange,
  onSortChange,
  onSearchChange,
  onPageChange,
}: PollListProps) => {
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-ink-900">Polls</h3>
      <div className="mt-3 flex flex-col gap-2 text-xs text-ink-500">
        <input
          className="soft-input h-10 py-2 text-sm"
          placeholder="Search polls"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="soft-input h-10 py-2"
            value={statusFilter}
            onChange={(event) =>
              onStatusChange(event.target.value as "ALL" | "OPEN" | "CLOSED")
            }
          >
            <option value="ALL">All</option>
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
          </select>
          <select
            className="soft-input h-10 py-2"
            value={sortOrder}
            onChange={(event) =>
              onSortChange(event.target.value as "ASC" | "DESC")
            }
          >
            <option value="DESC">Newest first</option>
            <option value="ASC">Oldest first</option>
          </select>
          <span className="ml-auto">{totalCount} total</span>
        </div>
      </div>
      {loading ? (
        <p className="mt-3 text-sm text-ink-500">Loading polls...</p>
      ) : polls.length === 0 ? (
        <p className="mt-3 text-sm text-ink-500">No polls yet.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {polls.map((poll) => {
            const closed = isClosed(poll);
            const active = poll.id === activePollId;
            const summary = getClosedSummary(poll);

            return (
              <button
                key={poll.id}
                type="button"
                onClick={() => onSelect(poll.id)}
                className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                  active
                    ? "border-accent/70 bg-white"
                    : "border-ink-500/15 bg-white/70 hover:border-ink-500/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink-900">
                    {poll.title}
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      closed
                        ? "bg-ink-500/10 text-ink-500"
                        : "bg-accent/10 text-accent"
                    }`}
                  >
                    {closed ? "Closed" : "Open"}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-ink-500">
                  <span>{poll.totalVotes} votes</span>
                  <span>-</span>
                  <span>{formatTimeLeft(poll.endsAt)}</span>
                </div>
                {summary && (
                  <p className="mt-2 text-xs text-ink-500">{summary}</p>
                )}
              </button>
            );
          })}
        </div>
      )}
      <div className="mt-4 flex items-center justify-between text-xs text-ink-500">
        <span>
          Page {page} of {Math.max(totalPages, 1)}
        </span>
        <div className="flex gap-2">
          <button
            className="ghost-button"
            type="button"
            disabled={!canPrev}
            onClick={() => onPageChange(page - 1)}
          >
            Prev
          </button>
          <button
            className="ghost-button"
            type="button"
            disabled={!canNext}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
