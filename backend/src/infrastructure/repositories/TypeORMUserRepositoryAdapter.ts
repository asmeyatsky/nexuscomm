import { DataSource, Repository } from 'typeorm';
import { UserRepositoryPort } from '@domain/ports/UserRepositoryPort';
import { User } from '@domain/valueObjects/User';
import { User as UserEntity } from '../../models/User';

/**
 * TypeORMUserRepositoryAdapter
 *
 * Architectural Intent:
 * - Implements the UserRepositoryPort using TypeORM
 * - Acts as an adapter between domain and infrastructure layers
 * - Transforms between domain entities and TypeORM entities
 * - Provides infrastructure-specific implementation details
 *
 * Key Design Decisions:
 * 1. Implements domain port interface
 * 2. Handles transformation between domain and data layer
 * 3. Uses TypeORM for database operations
 * 4. Maintains transaction boundaries where needed
 */
export class TypeORMUserRepositoryAdapter implements UserRepositoryPort {
  private repository: Repository<UserEntity>;

  constructor(private dataSource: DataSource) {
    this.repository = dataSource.getRepository(UserEntity);
  }

  async findById(id: string): Promise<User | null> {
    const entity = await this.repository.findOne({
      where: { id },
    });

    return entity ? this.toDomain(entity) : null;
  }

  async findByExternalId(externalId: string): Promise<User | null> {
    const entity = await this.repository.findOne({
      where: { username: externalId },
    });

    return entity ? this.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    if (!email) {
      return null;
    }

    const entity = await this.repository.findOne({
      where: { email },
    });

    return entity ? this.toDomain(entity) : null;
  }

  async save(user: User): Promise<User> {
    const entity = this.toTypeORM(user);
    const savedEntity = await this.repository.save(entity);
    return this.toDomain(savedEntity);
  }

  async update(user: User): Promise<User> {
    const entity = this.toTypeORM(user);
    const updatedEntity = await this.repository.save(entity);
    return this.toDomain(updatedEntity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findByIds(ids: string[]): Promise<User[]> {
    const entities = await this.repository.findByIds(ids);
    return entities.map(entity => this.toDomain(entity));
  }

  async updateOnlineStatus(userId: string, isOnline: boolean, lastSeen?: Date): Promise<User> {
    const updateData: Partial<UserEntity> = {
      status: isOnline ? 'active' : 'inactive',
      updatedAt: new Date(),
    };

    if (lastSeen) {
      updateData.lastLoginAt = lastSeen;
    }

    const result = await this.repository
      .createQueryBuilder()
      .update(UserEntity)
      .set(updateData)
      .where('id = :userId', { userId })
      .returning('*')
      .execute();

    if (result.affected === 0) {
      throw new Error(`User ${userId} not found`);
    }

    // Fetch the updated entity
    const updatedEntity = await this.repository.findOne({ where: { id: userId } });
    if (!updatedEntity) {
      throw new Error(`User ${userId} not found after update`);
    }

    return this.toDomain(updatedEntity);
  }

  async updateStatus(userId: string, status: string, statusEmoji?: string): Promise<User> {
    const updateData: Partial<UserEntity> = {
      status: status as UserEntity['status'],
      updatedAt: new Date(),
    };

    if (statusEmoji) {
      updateData.preferences = { statusEmoji };
    }

    const result = await this.repository
      .createQueryBuilder()
      .update(UserEntity)
      .set(updateData)
      .where('id = :userId', { userId })
      .returning('*')
      .execute();

    if (result.affected === 0) {
      throw new Error(`User ${userId} not found`);
    }

    // Fetch the updated entity
    const updatedEntity = await this.repository.findOne({ where: { id: userId } });
    if (!updatedEntity) {
      throw new Error(`User ${userId} not found after update`);
    }

    return this.toDomain(updatedEntity);
  }

  /**
   * Transform TypeORM entity to domain value object.
   * Maps from the DB schema (UserEntity) to the domain User VO.
   */
  private toDomain(entity: UserEntity): User {
    return new User({
      id: entity.id,
      externalId: entity.username,
      name: entity.displayName,
      email: entity.email || undefined,
      avatar: entity.profilePicture || undefined,
      isOnline: entity.status === 'active',
      lastSeen: entity.lastLoginAt || undefined,
      status: entity.status || undefined,
      statusEmoji: entity.preferences?.statusEmoji || undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  /**
   * Transform domain value object to TypeORM entity for persistence.
   */
  private toTypeORM(domain: User): UserEntity {
    const entity = new UserEntity();
    entity.id = domain.id;
    entity.username = domain.externalId;
    entity.displayName = domain.name;
    entity.email = domain.email || '';
    entity.profilePicture = domain.avatar || '';
    entity.status = (domain.status as UserEntity['status']) || 'active';
    entity.lastLoginAt = domain.lastSeen || null as unknown as Date;
    entity.preferences = domain.statusEmoji ? { statusEmoji: domain.statusEmoji } : {};
    entity.createdAt = domain.createdAt || new Date();
    entity.updatedAt = domain.updatedAt || new Date();

    return entity;
  }
}