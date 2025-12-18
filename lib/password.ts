import bcrypt from "bcryptjs";

export function isStrongPassword(password: string): boolean {
  const rules = [
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    password.length >= 8,
  ];
  return rules.every(Boolean);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
