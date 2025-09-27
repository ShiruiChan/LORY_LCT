import React from "react";

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
