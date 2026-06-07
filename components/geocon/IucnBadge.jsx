"use client";
// One IUCN status pill, everywhere. Colors come from lib/iucn (single source),
// shape from <Badge>. Replaces the hand-rolled status spans that each picked
// their own padding/font. Pass showLabel to append the full status name.

import { Badge } from "../ui/Badge";
import { IUCN_COLORS, IUCN_LABEL } from "../../lib/iucn";

export default function IucnBadge({ status, size = "sm", showLabel = false, style }) {
  if (!status) return null;
  const color = IUCN_COLORS[status] || "var(--gx-ink-muted)";
  return (
    <Badge color={color} size={size} mono uppercase title={IUCN_LABEL[status] || status} style={style}>
      {status}{showLabel ? ` · ${IUCN_LABEL[status] || status}` : ""}
    </Badge>
  );
}
