/**
 * The Git Studio activities whose progress is saved per account (learning_hub.activity_steps,
 * in the club website's repo). The ids and step counts must match record_activity_step there.
 */
export const ACTIVITIES = [
  {
    id: "git-activity-1",
    title: "Activity 1",
    name: "Basic Git commands",
    steps: 8,
    unit: "steps",
    href: "/learn/git/working-with-github#activity-1",
    stepNames: [
      "Create my-project",
      "git init",
      "Create your-name.txt",
      "Write and save",
      "git status",
      "git add .",
      "git commit",
      "git log",
    ],
  },
  {
    id: "git-activity-2",
    title: "Activity 2",
    name: "Branching and merging",
    steps: 7,
    unit: "steps",
    href: "/learn/git/branching#activity-2",
    stepNames: [
      "Create a branch",
      "List branches",
      "Switch to the branch",
      "Add a hobby line",
      "Commit on the branch",
      "Switch back to main",
      "Check branches again",
    ],
  },
  {
    id: "git-activity-3",
    title: "Activity 3",
    name: "Branching game",
    steps: 4,
    unit: "levels",
    href: "/learn/git/pull-requests-conflicts#activity-3",
    stepNames: ["Branch out", "Fast-forward merge", "Tidy up branches", "Remote sync"],
  },
] as const;

export type ActivityId = (typeof ACTIVITIES)[number]["id"];
export type Activity = (typeof ACTIVITIES)[number];

export function activityById(id: string): Activity | undefined {
  return ACTIVITIES.find((a) => a.id === id);
}

/** A real step of a real activity (1-based). */
export function isActivityStep(activity: unknown, step: unknown): activity is ActivityId {
  const found = typeof activity === "string" ? activityById(activity) : undefined;
  return !!found && typeof step === "number" && Number.isInteger(step) && step >= 1 && step <= found.steps;
}

/** "Step" or "Level", for one step of this activity. */
export function stepWord(activity: Activity) {
  return activity.unit === "levels" ? "Level" : "Step";
}
