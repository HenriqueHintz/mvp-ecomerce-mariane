import React from "react";

export interface ContainerProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  size?: "default" | "narrow" | "tight" | "wide";
  children: React.ReactNode;
}

const SIZE_CLASSES: Record<NonNullable<ContainerProps["size"]>, string> = {
  default: "max-w-7xl",
  wide: "max-w-7xl",
  narrow: "max-w-5xl",
  tight: "max-w-3xl",
};

export function Container({
  as: Component = "div",
  size = "default",
  className = "",
  children,
  ...props
}: ContainerProps) {
  const maxW = SIZE_CLASSES[size] || SIZE_CLASSES.default;
  return (
    <Component
      className={`${maxW} mx-auto px-4 sm:px-6 lg:px-8 ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  );
}

export default Container;
