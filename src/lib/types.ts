import type { ConcreteProduct } from "@/schemas/product";

export type { ConcreteProduct };

export interface ProductWithId extends ConcreteProduct {
  id: string;
}

export interface QuartileBounds {
  q25: number;
  q50: number;
  q75: number;
}
