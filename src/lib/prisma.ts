import { PrismaClient } from "@prisma/client";

// Jedna instanca klijenta i tokom hot-reload-a u razvoju.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
