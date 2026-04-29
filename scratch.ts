import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient().$extends({
  query: {
    $allModels: {
      async findFirst({ model, args, query }) {
        console.log('Model is:', model);
        return query(args);
      }
    }
  }
});
