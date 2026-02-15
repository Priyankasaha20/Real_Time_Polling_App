import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  profilePicture: string | null;
}

/**
 * verifyUser: Soft auth — attaches user to request if valid JWT exists,
 * but doesn't block the request (allows anonymous flow).
 */
export async function verifyUser(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const token = req.cookies?.token;
    if (!token) return next();

    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        profilePicture: true,
      },
    });

    if (user) {
      req.user = user as AuthUser;
    }
  } catch {
    // Invalid token — treat as anonymous
  }

  next();
}

/**
 * requireAuth: Hard auth — blocks request if no valid user.
 * Used for poll creation.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({
      error: "Authentication required",
      reason: "auth_required",
    });
    return;
  }
  next();
}
