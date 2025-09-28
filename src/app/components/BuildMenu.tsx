import React, { useEffect } from "react";

export type BuildOption = { type: string; title: string; cost: number };

type Props = {
  options: BuildOption[];
  position: { x: number; y: number };
  onSelect: (opt: BuildOption) => void;
  onClose: () => void;
};

export default function BuildMenu({
  options,
  position,
  onSelect,
  onClose,
}: Props) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <div
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        zIndex: 20,
      }}
      className="bg-white rounded-xl shadow-lg ring-1 ring-slate-200 p-3 space-y-2"
      onClick={(e) => e.stopPropagation()}
    >
      {options.map((opt) => (
        <button
          key={opt.type}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(opt);
          }}
          className="flex justify-between w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100"
        >
          <span>{opt.title}</span>
          <span className="text-slate-500 text-sm">– {opt.cost}₽</span>
        </button>
      ))}
    </div>
  );
}
