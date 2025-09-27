import React from "react";
import { useGame } from "../../../store/game";

export default function DevPanel() {
  const { addCoins, reset } = useGame();

  return (
    <div className="flex gap-2 mt-4">
      <button
        className="px-2 py-1 bg-green-500 text-white rounded"
        onClick={() => addCoins(1000)}
      >
        +1000 монет
      </button>
      <button
        className="px-2 py-1 bg-gray-500 text-white rounded"
        onClick={() => reset()}
      >
        Reset
      </button>
    </div>
  );
}
