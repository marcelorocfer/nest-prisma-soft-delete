import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
console.log('Keys in PrismaClient:', Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')));
