import { AppDataSource } from '@config/database';
import { IdentityFilter } from '@models/IdentityFilter';
import { AppError } from '@middleware/errorHandler';

export class IdentityFilterService {
  private filterRepository = AppDataSource.getRepository(IdentityFilter);

  /**
   * Create a new identity filter
   */
  async createFilter(
    userId: string,
    data: {
      name: string;
      description?: string;
      accountIds: string[];
      color?: string;
    }
  ): Promise<IdentityFilter> {
    // Get max order
    const maxOrder = await this.filterRepository
      .createQueryBuilder('f')
      .where('f.userId = :userId', { userId })
      .select('MAX(f.order)', 'max')
      .getRawOne();

    const filter = this.filterRepository.create({
      userId,
      name: data.name,
      description: data.description,
      accountIds: data.accountIds,
      color: data.color || '#3b82f6',
      order: (maxOrder?.max || 0) + 1,
      isActive: true,
    });

    return this.filterRepository.save(filter);
  }

  /**
   * Get all filters for a user
   */
  async getUserFilters(userId: string): Promise<IdentityFilter[]> {
    return this.filterRepository
      .createQueryBuilder('f')
      .where('f.userId = :userId', { userId })
      .orderBy('f.order', 'ASC')
      .getMany();
  }

  /**
   * Get filter by ID
   */
  async getFilterById(filterId: string, userId: string): Promise<IdentityFilter | null> {
    return this.filterRepository.findOne({
      where: { id: filterId, userId },
      relations: ['accounts'],
    });
  }

  /**
   * Update filter
   */
  async updateFilter(
    filterId: string,
    userId: string,
    updates: Partial<IdentityFilter>
  ): Promise<IdentityFilter> {
    const filter = await this.getFilterById(filterId, userId);

    if (!filter) {
      throw new AppError(404, 'Filter not found', 'FILTER_NOT_FOUND');
    }

    Object.assign(filter, updates);
    return this.filterRepository.save(filter);
  }

  /**
   * Delete filter
   */
  async deleteFilter(filterId: string, userId: string): Promise<void> {
    const filter = await this.getFilterById(filterId, userId);

    if (!filter) {
      throw new AppError(404, 'Filter not found', 'FILTER_NOT_FOUND');
    }

    await this.filterRepository.remove(filter);
  }

  /**
   * Reorder filters
   */
  async reorderFilters(userId: string, filterIds: string[]): Promise<IdentityFilter[]> {
    const updates = filterIds.map((id, index) => ({ id, order: index }));

    for (const update of updates) {
      await this.filterRepository.update(
        { id: update.id, userId },
        { order: update.order }
      );
    }

    return this.getUserFilters(userId);
  }
}
