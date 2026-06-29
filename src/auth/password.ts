import { compare, hash } from "bcryptjs";

const passwordCost = 12;

export function hashPassword(password: string) {
  return hash(password, passwordCost);
}

export function verifyPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash);
}
