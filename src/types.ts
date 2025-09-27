export type Quest = {
id: string
title: string
description?: string
progress: number
}

export type ShopItem = {
id: string
title: string
price: number
description?: string
}	

export type Axial = { q: number; r: number };

export interface Building {
  id: string;
  type: 'house' | 'shop' | 'factory' | 'park';
  level: number;
  incomePerHour: number;
  coord: Axial; // если используешь координаты гекса
  position: { x: number; y: number };
}


export type Tile = {
  id: string;
  coord: Axial;
  biome: 'water' | 'grass' | 'forest' | 'mountain' | 'desert';
};

export type World = {
  seed: string;
  radius: number; // радиус «шестигранного диска»
  tiles: Tile[];
};
