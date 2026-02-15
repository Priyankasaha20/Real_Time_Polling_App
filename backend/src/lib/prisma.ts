import { PrismaClient } from "@prisma/client";
import { env } from "../config/env";

// Prisma 7 requires passing the database URL to the constructor
export const prisma = new PrismaClient({
  datasourceUrl: env.DATABASE_URL,
});
