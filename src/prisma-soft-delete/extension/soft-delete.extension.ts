import { Prisma } from '@prisma/client';
import { SoftDeleteOptions } from '../types/soft-delete.types';

/**
 * Prisma Extension to handle soft deletes automatically.
 * 
 * Replaces the deprecated Middleware approach.
 */
export function softDeleteExtension(options: SoftDeleteOptions) {
  return Prisma.defineExtension((client) => {
    return client.$extends({
      name: 'softDelete',
      query: {
        $allModels: {
          // --- READ OPERATIONS ---
          async findFirst({ model, args, query }) {
            if (!options.models.includes(model as any)) return query(args);
            handleReadArgs(args);
            return query(args);
          },
          async findMany({ model, args, query }) {
            if (!options.models.includes(model as any)) return query(args);
            handleReadArgs(args);
            return query(args);
          },
          async count({ model, args, query }) {
            if (!options.models.includes(model as any)) return query(args);
            handleReadArgs(args);
            return query(args);
          },
          async aggregate({ model, args, query }) {
            if (!options.models.includes(model as any)) return query(args);
            handleReadArgs(args);
            return query(args);
          },
          async groupBy({ model, args, query }) {
            if (!options.models.includes(model as any)) return query(args);
            handleReadArgs(args);
            return query(args);
          },
          async findUnique({ model, args, query }) {
            if (!options.models.includes(model as any)) return query(args);
            
            const { _withTrashed, _onlyTrashed } = (args.where || {}) as any;
            
            if (_onlyTrashed || !_withTrashed) {
              // findUnique doesn't allow filtering by non-unique fields like deletedAt
              // So we must convert it to findFirst
              handleReadArgs(args);
              return (client as any)[model].findFirst(args);
            }
            
            return query(args);
          },

          // --- DELETE OPERATIONS ---
          async delete({ model, args, query }) {
            if (!options.models.includes(model as any)) return query(args);
            
            return (client as any)[model].update({
              where: args.where,
              data: { deletedAt: new Date() },
            });
          },
          async deleteMany({ model, args, query }) {
            if (!options.models.includes(model as any)) return query(args);
            
            return (client as any)[model].updateMany({
              where: args.where,
              data: { deletedAt: new Date() },
            });
          },
        },
      },
    });
  });
}

/**
 * Helper to inject deletedAt filters into query arguments
 */
function handleReadArgs(args: any) {
  args.where = args.where || {};
  const withTrashed = args.where._withTrashed === true;
  const onlyTrashed = args.where._onlyTrashed === true;

  delete args.where._withTrashed;
  delete args.where._onlyTrashed;

  if (onlyTrashed) {
    args.where.deletedAt = { not: null };
  } else if (!withTrashed) {
    args.where.deletedAt = null;
  }
}
