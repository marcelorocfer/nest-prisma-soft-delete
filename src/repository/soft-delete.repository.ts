import { SoftDeletableModel } from '../types/soft-delete.types';

/**
 * Base Repository for Soft Delete operations.
 * 
 * @template T The Model type
 * @template Where The ModelWhereInput type
 */
export abstract class SoftDeleteRepository<T extends SoftDeletableModel, Where> {
  protected readonly tableName: string;

  /**
   * @param prismaInstance The PrismaService or PrismaClient instance
   * @param modelName The name of the model in Prisma (e.g., 'user')
   * @param tableName The actual name of the table in the database (optional)
   */
  constructor(
    protected readonly prismaInstance: any,
    protected readonly modelName: string,
    tableName?: string,
  ) {
    this.tableName = tableName || modelName;
  }

  /**
   * Returns the model delegate (e.g., prisma.user)
   */
  protected get modelDelegate() {
    return this.prismaInstance[this.modelName];
  }

  /**
   * Soft deletes a record by its ID.
   * Note: If middleware is active, 'delete' automatically becomes 'update' with deletedAt.
   */
  async softDelete(id: string | number): Promise<T> {
    return this.modelDelegate.delete({
      where: { id },
    });
  }

  /**
   * Restores a soft-deleted record.
   */
  async restore(id: string | number): Promise<T> {
    return this.modelDelegate.update({
      where: { id },
      data: { deletedAt: null } as any,
      // We don't need _withTrashed here because update doesn't filter by deletedAt usually
      // but if the middleware filters update, we might need it. 
      // Our middleware currently doesn't filter 'update'.
    });
  }

  /**
   * Physically deletes a record from the database.
   * Uses $executeRaw to bypass the middleware transformation.
   */
  async forceDelete(id: string | number): Promise<void> {
    const tableName = this.tableName;
    // Note: Uses $executeRaw to bypass the middleware transformation.
    await this.prismaInstance.$executeRawUnsafe(
      `DELETE FROM "${tableName}" WHERE id = $1`,
      id,
    );
  }

  /**
   * Finds records including those that have been soft-deleted.
   */
  async findWithTrashed(where: Where = {} as Where): Promise<T[]> {
    return this.modelDelegate.findMany({
      where: {
        ...where,
        _withTrashed: true,
      } as any,
    });
  }

  /**
   * Finds only records that have been soft-deleted.
   */
  async findOnlyTrashed(where: Where = {} as Where): Promise<T[]> {
    return this.modelDelegate.findMany({
      where: {
        ...where,
        _onlyTrashed: true,
      } as any,
    });
  }
}
