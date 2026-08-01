"use client";

import { MotionConfig } from "framer-motion";

// Framer Motion animations run via inline styles, so the global
// prefers-reduced-motion rules in globals.css don't reach them.
// reducedMotion="user" makes every motion component under the tree
// skip transform/layout animations when the OS setting is on.
export default function MotionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
