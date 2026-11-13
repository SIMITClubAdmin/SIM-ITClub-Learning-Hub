import { redirect } from "next/navigation";

/** /learn/git opens the first Git & GitHub lesson. */
export default function GitTrackPage() {
  redirect("/learn/git/introduction");
}
