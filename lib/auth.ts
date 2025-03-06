// lib/auth.ts
import jwt from 'jsonwebtoken';

interface DecodedUser {
  id: number;
  role: string;
}

export function getUserFromToken(token: string): DecodedUser | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as DecodedUser;
    return decoded;
  } catch {
    return null;
  }
}
