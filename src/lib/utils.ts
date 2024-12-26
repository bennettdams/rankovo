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
