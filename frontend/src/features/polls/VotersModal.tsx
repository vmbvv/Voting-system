import type { User } from "../../types";

type VotersModalProps = {
  open: boolean;
  optionLabel: string;
  voters: User[];
  loading: boolean;
  error?: string;
  page: number;
  totalPages: number;
  totalCount: number;
  onClose: () => void;
  onPageChange: (page: number) => void;
};

export const VotersModal = ({
  open,
  optionLabel,
  voters,
  loading,
  error,
  page,
  totalPages,
  totalCount,
  onClose,
  onPageChange,
}: VotersModalProps) => {
  if (!open) return null;

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="card w-full max-w-md p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-ink-500">
              Voters
            </p>
            <h3 className="mt-1 text-lg font-semibold text-ink-900">
              {optionLabel}
            </h3>
            <p className="text-xs text-ink-500">
              {totalCount} total · Page {page} of {Math.max(totalPages, 1)}
            </p>
          </div>
          <button className="ghost-button" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="mt-4">
          {loading && <p className="text-sm text-ink-500">Loading voters...</p>}
          {!loading && error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          {!loading && !error && voters.length === 0 && (
            <p className="text-sm text-ink-500">No votes yet.</p>
          )}
          {!loading && !error && voters.length > 0 && (
            <ul className="space-y-2 text-sm text-ink-700">
              {voters.map((voter) => (
                <li key={voter.id}>{voter.name ?? voter.email}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between text-xs text-ink-500">
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
    </div>
  );
};
