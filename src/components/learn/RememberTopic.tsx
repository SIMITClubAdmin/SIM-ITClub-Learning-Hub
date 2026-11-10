"use client";

import { useEffect } from "react";
import { rememberLearnTopic } from "@/lib/learn-trail";

/** Tells the Learn wheel which topic was studied, so its rocket flies on to the next one. */
export function RememberTopic({ slug }: { slug: string }) {
  useEffect(() => rememberLearnTopic(slug), [slug]);
  return null;
}
