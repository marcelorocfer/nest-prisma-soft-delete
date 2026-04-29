import { Prisma } from '@prisma/client';
import { SoftDeleteOptions } from '../types/soft-delete.types';

/**
 * Prisma Middleware to handle soft deletes automatically.
 * 
 * Intercepts 'delete' and 'deleteMany' to perform updates instead.
 * Intercepts read operations to filter out deleted records by default.
 */
export function softDeleteMiddleware(options: SoftDeleteOptions): any {
  return async (params: any, next: any) => {
    const { model, action, args = {} } = params;

    // Skip if model is not configured for soft delete
    if (!model || !options.models.includes(model)) {
      return next(params);
    }

    const where = args.where || {};
    const withTrashed = where._withTrashed === true;
    const onlyTrashed = where._onlyTrashed === true;

    // Remove internal flags from the where clause before Prisma processes it
    if (args.where) {
      delete args.where._withTrashed;
      delete args.where._onlyTrashed;
    }

    // --- READ OPERATIONS ---
    if (
      ['findFirst', 'findMany', 'count', 'aggregate', 'groupBy'].includes(action)
    ) {
      if (onlyTrashed) {
        params.args.where = { ...where, deletedAt: { not: null } };
      } else if (!withTrashed) {
        params.args.where = { ...where, deletedAt: null };
      }
    }

    // Special handling for findUnique: it must be converted to findFirst 
    // because findUnique only accepts unique identifiers.
    if (action === 'findUnique') {
      if (onlyTrashed) {
        params.action = 'findFirst';
        params.args.where = { ...where, deletedAt: { not: null } };
      } else if (!withTrashed) {
        params.action = 'findFirst';
        params.args.where = { ...where, deletedAt: null };
      }
    }

    // --- DELETE OPERATIONS ---
    if (action === 'delete') {
      // Transform delete into update
      params.action = 'update';
      params.args.data = { deletedAt: new Date() };
    }

    if (action === 'deleteMany') {
      // Transform deleteMany into updateMany
      params.action = 'updateMany';
      if (params.args.data) {
        params.args.data.deletedAt = new Date();
      } else {
        params.args.data = { deletedAt: new Date() };
      }
    }

    return next(params);
  };
}
