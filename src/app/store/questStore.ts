import { create } from "zustand";
import { useGame } from "./game";

/** A quest can be daily, weekly or monthly. */
export type QuestPeriod = "daily" | "weekly" | "monthly";

/** Possible statuses of a quest. */
export type QuestStatus =
  | "locked" // not visible to the player
  | "available" // visible and can be started
  | "active" // in progress
  | "completed" // goal met, can be claimed
  | "rewarded"; // reward already collected

export interface Quest {
  id: string;
  title: string;
  description?: string;
  /** Reward given in coins when the quest is claimed. */
  rewardCoins: number;
  /** How often this quest repeats/appears in the list. */
  period: QuestPeriod;
  /** Tags describing what actions advance the quest (e.g. 'build', 'learn', 'invest'). */
  tags: string[];
  /** Optional ISO date string defining when the quest expires. */
  endsAt?: string;
  /** Current status of the quest. */
  status: QuestStatus;
  /** Progress ratio between 0 and 1. Computed as `current / goal`. */
  progress: number;
  /** Internal current progress value. */
  current: number;
  /** Internal goal value. Defaults to 1 for single‑step quests. */
  goal: number;
}

export type QuestInput = Omit<
  Quest,
  "id" | "status" | "progress" | "current" | "goal"
> & {
  goal?: number;
};

interface QuestStoreState {
  quests: Quest[];
  /** Fetches the current quests.  Currently this simply triggers a state update. */
  fetch: () => void;
  /** Start a quest: sets its status to 'active'. */
  start: (id: string) => void;
  /** Claim a completed quest: awards coins and marks as rewarded. */
  claim: (id: string) => void;
  /** Add a new quest. */
  addQuest: (input: QuestInput) => void;
  /** Update an existing quest. */
  updateQuest: (id: string, input: QuestInput) => void;
  /** Delete a quest. */
  deleteQuest: (id: string) => void;
  /** Increment progress for all active quests that include the given tag. */
  incrementProgressForTag: (tag: string, amount?: number) => void;
}

export const useQuests = create<QuestStoreState>((set, get) => ({
  quests: [],
  fetch: () => {
    set((state) => ({ quests: [...state.quests] }));
  },
  start: (id) =>
    set((state) => ({
      quests: state.quests.map((q) =>
        q.id === id && q.status === "available" ? { ...q, status: "active" } : q
      ),
    })),
  claim: (id) => {
    const { quests } = get();
    const quest = quests.find((q) => q.id === id);
    if (!quest || quest.status !== "completed") return;
    // Award the reward via the game store
    const { addCoins } = useGame.getState();
    addCoins(quest.rewardCoins);
    set((state) => ({
      quests: state.quests.map((q) =>
        q.id === id ? { ...q, status: "rewarded" } : q
      ),
    }));
  },
  addQuest: (input) =>
    set((state) => {
      const id = crypto.randomUUID();
      const goal = input.goal ?? 1;
      const newQuest: Quest = {
        id,
        title: input.title,
        description: input.description,
        rewardCoins: input.rewardCoins,
        period: input.period,
        tags: input.tags ?? [],
        endsAt: input.endsAt,
        status: "available",
        progress: 0,
        current: 0,
        goal,
      };
      return { quests: [...state.quests, newQuest] };
    }),
  updateQuest: (id, input) =>
    set((state) => ({
      quests: state.quests.map((q) => {
        if (q.id !== id) return q;
        const goal = input.goal ?? q.goal;
        // Ensure current does not exceed the new goal
        let current = q.current > goal ? goal : q.current;
        return {
          ...q,
          title: input.title,
          description: input.description,
          rewardCoins: input.rewardCoins,
          period: input.period,
          tags: input.tags ?? [],
          endsAt: input.endsAt,
          goal,
          current,
          progress: current / goal,
        };
      }),
    })),
  deleteQuest: (id) =>
    set((state) => ({ quests: state.quests.filter((q) => q.id !== id) })),
  incrementProgressForTag: (tag, amount = 1) =>
    set((state) => {
      return {
        quests: state.quests.map((q) => {
          if (
            q.status !== "active" ||
            !q.tags.includes(tag) ||
            q.current >= q.goal
          ) {
            return q;
          }
          const nextCurrent = q.current + amount;
          const current = nextCurrent > q.goal ? q.goal : nextCurrent;
          const progress = current / q.goal;
          const status = current >= q.goal ? "completed" : q.status;
          return { ...q, current, progress, status };
        }),
      };
    }),
}));
