import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isServer() {
  return typeof window === "undefined";
}

/**
 * @throws Error if key not in object
 */
export function isKeyOfObj<TObj extends object>(
  obj: TObj,
  k: PropertyKey,
): k is keyof TObj {
  const isIn = k in obj;
  if (!isIn) {
    throw new Error(`Key ${k.toString()} not found in object ${obj}`);
  } else {
    return true;
  }
}

export function pickRandomFromArray<T>(array: T[] | Readonly<T[]>): T {
  const entry = array[Math.floor(Math.random() * array.length)];
  if (!entry) throw new Error("No random element found");
  return entry;
}

export function createRandomNumberBetween({
  min,
  max,
  decimalPlaces = 0,
}: {
  min: number;
  max: number;
  decimalPlaces?: number;
}): number {
  const res = Math.random() * (max - min) + min;
  if (decimalPlaces === 0) {
    return res;
  } else {
    const multiplier = decimalPlaces * 10;
    return Math.round(res * multiplier) / multiplier;
  }
}
