import React from "react";
import { useGame } from "../../../store/game";

type Props = { id: string };

export default function BuildingControls({ id }: Props) {
  const { upgradeBuilding, removeBuilding } = useGame();

  return (
    <div className="flex gap-2">
      <button
        className="px-2 py-1 bg-blue-500 text-white rounded"
        onClick={() => upgradeBuilding(id)}
      >
        Улучшить
      </button>
      <button
        className="px-2 py-1 bg-red-500 text-white rounded"
        onClick={() => removeBuilding(id)}
      >
        Снести
      </button>
    </div>
  );
}
