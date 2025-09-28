import React from "react";

/**
 * A simple wrapper around a button that vertically stacks an icon and a label.
 * This component is used in the bottom navigation bar. The styling matches
 * the upstream project but can be customised via tailwind classes on the
 * parent NavLink.
 */
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label?: string;
};

export default function IconButton({ label, children, ...rest }: Props) {
  return (
    <button
      {...rest}
      aria-label={label}
      className="flex flex-col items-center text-xs focus:outline-none"
    >
      {children}
      {label && <span className="mt-1 text-[11px] text-gray-600">{label}</span>}
    </button>
  );
}