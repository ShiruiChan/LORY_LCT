import React, { useEffect } from "react";

// A small context menu that appears near the cursor when the user clicks
// on a tile in the city. It lists available building options. When an
// option is selected the caller should handle the construction logic.
export type BuildOption = { type: string; title: string; cost: number };

type Props = {
  options: BuildOption[];
  position: { x: number; y: number };
  onSelect: (opt: BuildOption) => void;
  onClose: () => void;
};

export default function BuildMenu({ options, position, onSelect, onClose }: Props) {
  // Close the menu when the user presses Escape or clicks anywhere
  // outside of the menu. The click listener is registered on the
  // capture phase so that it runs before other handlers.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function handleClick() {
      onClose();
    }
    document.addEventListener("keydown", handleKey);
    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("click", handleClick, true);
    };
  }, [onClose]);

  return (
    <div
      style={{ position: "absolute", left: position.x, top: position.y, zIndex: 20 }}
      className="bg-white rounded-xl shadow-lg ring-1 ring-slate-200 p-3 space-y-2"
      // Stop propagation so clicks on the menu don't trigger the outside handler
      onClick={(e) => e.stopPropagation()}
    >
      {options.map((opt) => (
        <button
          key={opt.type}
          onClick={() => onSelect(opt)}
          className="flex justify-between w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100"
        >
          <span>{opt.title}</span>
          <span className="text-slate-500 text-sm">– {opt.cost}₽</span>
        </button>
      ))}
    </div>
  );
}