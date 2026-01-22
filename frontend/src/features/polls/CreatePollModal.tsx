import { useState, type FormEvent } from "react";
import { useMutation } from "@apollo/client/react";
import { CREATE_POLL_MUTATION } from "../../graphql/operations";
import type { CreatePollData, CreatePollVars } from "../../types";

const makeOptionId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createOption = () => ({ id: makeOptionId(), text: "" });

type DurationValue = "none" | "1h" | "24h" | "3d" | "7d";

const durationOptions: {
  label: string;
  value: DurationValue;
  ms: number | null;
}[] = [
  { label: "No end", value: "none", ms: null },
  { label: "1 hour", value: "1h", ms: 60 * 60 * 1000 },
  { label: "24 hours", value: "24h", ms: 24 * 60 * 60 * 1000 },
  { label: "3 days", value: "3d", ms: 3 * 24 * 60 * 60 * 1000 },
  { label: "7 days", value: "7d", ms: 7 * 24 * 60 * 60 * 1000 },
];

const buildEndsAt = (value: DurationValue) => {
  const option = durationOptions.find((item) => item.value === value);
  if (!option || !option.ms) return null;
  return new Date(Date.now() + option.ms).toISOString();
};

const createInitialForm = () => ({
  title: "",
  description: "",
  options: [createOption(), createOption()],
  duration: "24h" as DurationValue,
  allowMultiple: false,
  anonymousVoting: false,
});

type CreatePollModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (pollId: string) => void;
};

export const CreatePollModal = ({
  open,
  onClose,
  onCreated,
}: CreatePollModalProps) => {
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState(createInitialForm());

  const [createPoll, { loading: createLoading }] = useMutation<
    CreatePollData,
    CreatePollVars
  >(CREATE_POLL_MUTATION);

  if (!open) return null;

  const handleCreatePoll = async (event: FormEvent) => {
    event.preventDefault();
    setCreateError(null);

    const title = createForm.title.trim();
    const description = createForm.description.trim();
    const optionInputs = createForm.options
      .map((option) => option.text.trim())
      .filter(Boolean)
      .map((text) => ({ text }));

    if (!title) {
      setCreateError("Question is required.");
      return;
    }

    if (optionInputs.length < 2) {
      setCreateError("At least 2 options are required.");
      return;
    }

    try {
      const endsAt = buildEndsAt(createForm.duration);

      const { data } = await createPoll({
        variables: {
          input: {
            title,
            description: description ? description : null,
            options: optionInputs,
            startsAt: null,
            endsAt,
            allowMultiple: createForm.allowMultiple,
            anonymousVoting: createForm.anonymousVoting,
          },
        },
      });

      if (data?.createPoll) {
        onCreated(data.createPoll.id);
        setCreateForm(createInitialForm());
        setCreateError(null);
      }
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Create poll failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="card w-full max-w-2xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold text-ink-900">
              Create a Poll
            </h3>
            <p className="text-sm text-ink-500">
              Ask a clear question and add at least two options.
            </p>
          </div>
          <button className="ghost-button" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleCreatePoll}>
          <div>
            <label className="text-sm font-semibold text-ink-700">
              Question
            </label>
            <input
              className="soft-input mt-2"
              placeholder="What question do you want to ask?"
              value={createForm.title}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  title: event.target.value,
                }))
              }
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-ink-700">
              Description (optional)
            </label>
            <input
              className="soft-input mt-2"
              placeholder="Add context for voters"
              value={createForm.description}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-ink-700">
              Options
            </label>
            <div className="mt-2 space-y-2">
              {createForm.options.map((option, index) => (
                <div key={option.id} className="flex items-center gap-2">
                  <input
                    className="soft-input"
                    placeholder={`Option ${index + 1}`}
                    value={option.text}
                    onChange={(event) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        options: prev.options.map((item) =>
                          item.id === option.id
                            ? { ...item, text: event.target.value }
                            : item,
                        ),
                      }))
                    }
                  />
                  {createForm.options.length > 2 && (
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() =>
                        setCreateForm((prev) => ({
                          ...prev,
                          options: prev.options.filter(
                            (item) => item.id !== option.id,
                          ),
                        }))
                      }
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              className="ghost-button mt-3"
              type="button"
              onClick={() =>
                setCreateForm((prev) => ({
                  ...prev,
                  options: [...prev.options, createOption()],
                }))
              }
            >
              + Add another option
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-ink-700">
                Duration
              </label>
              <select
                className="soft-input mt-2"
                value={createForm.duration}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    duration: event.target.value as DurationValue,
                  }))
                }
              >
                {durationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col justify-center gap-3">
              <label className="flex items-center gap-2 text-sm text-ink-700">
                <input
                  type="checkbox"
                  checked={createForm.allowMultiple}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      allowMultiple: event.target.checked,
                    }))
                  }
                />
                Allow multiple answers
              </label>
              <label className="flex items-center gap-2 text-sm text-ink-700">
                <input
                  type="checkbox"
                  checked={createForm.anonymousVoting}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      anonymousVoting: event.target.checked,
                    }))
                  }
                />
                Anonymous voting
              </label>
            </div>
          </div>

          {createError && <p className="text-sm text-red-600">{createError}</p>}

          <div className="flex flex-wrap justify-end gap-3">
            <button className="ghost-button" type="button" onClick={onClose}>
              Cancel
            </button>
            <button
              className="primary-button"
              type="submit"
              disabled={createLoading}
            >
              {createLoading ? "Creating..." : "Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
