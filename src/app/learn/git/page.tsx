import type { Metadata } from "next";
import { GitLearningPage } from "@/components/git-studio/GitLearningPage";

export const metadata: Metadata = { title: "How Git & GitHub work · Git & GitHub · ITCamp Learning Hub" };

export default function GitTrackPage() {
  return <GitLearningPage />;
}
