import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { LOGOUT_MUTATION, ME_QUERY, POLLS_QUERY } from "./graphql/operations";
import type { LogoutData, MeData, PollsData, PollsVars } from "./types";
import { AuthCard } from "./features/auth/AuthCard";
import { CreatePollModal } from "./features/polls/CreatePollModal";
import { PollResultsCard } from "./features/polls/PollResultsCard";
import { PollList } from "./features/polls/PollList";

function App() {
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [activePollId, setActivePollId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "CLOSED">(
    "ALL",
  );
  const [sortOrder, setSortOrder] = useState<"DESC" | "ASC">("DESC");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const {
    data: meData,
    loading: meLoading,
    refetch: refetchMe,
  } = useQuery<MeData>(ME_QUERY);

  const [logoutUser, { loading: logoutLoading }] =
    useMutation<LogoutData>(LOGOUT_MUTATION);

  const {
    data: pollsData,
    previousData: previousPollsData,
    loading: pollsLoading,
    refetch: refetchPolls,
  } = useQuery<PollsData, PollsVars>(POLLS_QUERY, {
    pollInterval: 5000,
    variables: {
      input: {
        status: statusFilter === "ALL" ? null : statusFilter,
        search: search.trim() || null,
        sort: {
          field: "CREATED_AT",
          order: sortOrder,
        },
        page,
        pageSize,
      },
    },
  });

  const pollPage = pollsData?.polls ?? previousPollsData?.polls;
  const polls = pollPage?.items ?? [];
  const user = meData?.me ?? null;
  const isInitialPollsLoading = pollsLoading && !pollPage;

  useEffect(() => {
    setPage(1);
  }, [statusFilter, sortOrder, search]);

  useEffect(() => {
    if (!pollPage) return;
    if (pollPage.page !== page) {
      setPage(pollPage.page);
    }
  }, [pollPage?.page, page]);

  useEffect(() => {
    if (!polls.length) {
      setActivePollId(null);
      return;
    }

    if (activePollId && polls.some((poll) => poll.id === activePollId)) {
      return;
    }

    const now = Date.now();
    const firstOpen = polls.find((poll) => {
      if (poll.status === "CLOSED") return false;
      if (poll.endsAt && new Date(poll.endsAt).getTime() <= now) return false;
      return true;
    });

    setActivePollId(firstOpen?.id ?? polls[0].id);
  }, [polls, activePollId]);

  const activePoll = polls.find((poll) => poll.id === activePollId) ?? null;

  const handlePollCreated = (pollId: string) => {
    setActivePollId(pollId);
    setCreateOpen(false);
    refetchPolls();
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      await refetchMe();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-ink-500">
              Voting System
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {user ? (
              <div className="rounded-full border border-ink-500/20 bg-white/70 px-4 py-2 text-sm text-ink-700">
                Signed in as <span className="font-semibold">{user.email}</span>
              </div>
            ) : (
              <div className="rounded-full border border-ink-500/20 bg-white/70 px-4 py-2 text-sm text-ink-700">
                Sign in to create polls
              </div>
            )}
            {user && (
              <>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => setCreateOpen(true)}
                >
                  Create Poll
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={handleLogout}
                  disabled={logoutLoading}
                >
                  {logoutLoading ? "Signing out..." : "Sign out"}
                </button>
              </>
            )}
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="flex flex-col gap-6">
            <PollResultsCard
              poll={activePoll}
              currentUserId={user?.id ?? null}
              onPollUpdated={refetchPolls}
            />

            <div className="card animate-fade-up p-6">
              <h3 className="text-lg font-semibold text-ink-900">
                How it works
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-ink-700">
                <li>Create a poll with at least two options.</li>
                <li>Vote once per poll (enforced on the backend).</li>
                <li>Results update instantly from stored counters.</li>
              </ul>
            </div>
          </section>

          <aside className="flex flex-col gap-6">
            {!user && (
              <AuthCard
                user={user}
                loading={meLoading}
                onAuthSuccess={refetchMe}
              />
            )}
            <PollList
              polls={polls}
              activePollId={activePollId}
              onSelect={setActivePollId}
              loading={isInitialPollsLoading}
              statusFilter={statusFilter}
              sortOrder={sortOrder}
              search={search}
              page={pollPage?.page ?? page}
              totalPages={pollPage?.totalPages ?? 1}
              totalCount={pollPage?.totalCount ?? 0}
              onStatusChange={setStatusFilter}
              onSortChange={setSortOrder}
              onSearchChange={setSearch}
              onPageChange={setPage}
            />
          </aside>
        </div>
      </div>

      <CreatePollModal
        open={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handlePollCreated}
      />
    </div>
  );
}

export default App;
