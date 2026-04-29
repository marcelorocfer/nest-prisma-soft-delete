export interface SoftDeleteOptions {
  /**
   * List of Prisma models that should have soft delete enabled.
   * Example: ['User', 'Post']
   */
  models: string[];
}

/**
 * Interface representing a model that has a deletedAt field.
 */
export interface SoftDeletableModel {
  deletedAt?: Date | null;
}

/**
 * Extended query types to include soft delete flags
 */
export interface SoftDeleteQueryFlags {
  _withTrashed?: boolean;
  _onlyTrashed?: boolean;
}
