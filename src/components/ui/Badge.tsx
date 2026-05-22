// Status badge for trust notes and result states.
import type { ReactNode } from "react";

type BadgeTone = "success" | "info" | "warning" | "neutral";

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: BadgeTone }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
