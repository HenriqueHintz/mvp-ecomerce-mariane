import React from "react";

export type SvgIconName =
  | "shopping-bag"
  | "check"
  | "eye"
  | "chevron-left"
  | "chevron-right"
  | "chevron-down"
  | "arrow-right"
  | "map-pin"
  | "phone"
  | "clock"
  | "message-circle"
  | "instagram"
  | "shield-check"
  | "truck"
  | "credit-card"
  | "navigation"
  | "external-link"
  | "copy"
  | "search"
  | "home";

export function SvgIcon({
  name,
  className = "w-4 h-4",
}: {
  name: SvgIconName;
  className?: string;
}) {
  return (
    <svg aria-hidden="true" className={className}>
      <use href={`/icons.svg#${name}`} />
    </svg>
  );
}

export default SvgIcon;
