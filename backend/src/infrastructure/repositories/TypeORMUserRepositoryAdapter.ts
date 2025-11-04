import { DataSource, Repository } from 'typeorm';
import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { User } from '../../domain/value_objects/User';
import { User as UserEntity } from '../entities/User'; // The TypeORM entity

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
    const userEntity = await this.repository.findOne({
      where: { id },
    });

    return userEntity ? this.toDomain(userEntity) : null;
  }

  async findByExternalId(externalId: string): Promise<User | null> {
    const userEntity = await this.repository.findOne({
      where: { externalId },
    });

    return userEntity ? this.toDomain(userEntity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    if (!email) {
      return null;
    }
    
    const userEntity = await this.repository.findOne({
      where: { email },
    });

    return userEntity ? this.toDomain(userEntity) : null;
  }

  async save(user: User): Promise<User> {
    const userEntity = this.toTypeORM(user);
    const savedEntity = await this.repository.save(userEntity);
    return this.toDomain(savedEntity);
  }

  async update(user: User): Promise<User> {
    const userEntity = this.toTypeORM(user);
    const updatedEntity = await this.repository.save(userEntity);
    return this.toDomain(updatedEntity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findByIds(ids: string[]): Promise<User[]> {
    const userEntities = await this.repository.findByIds(ids);
    return userEntities.map(entity => this.toDomain(entity));
  }

  async updateOnlineStatus(userId: string, isOnline: boolean, lastSeen?: Date): Promise<User> {
    const updateData: Partial<UserEntity> = {
      isOnline,
      updatedAt: new Date(),
    };
    
    if (lastSeen) {
      updateData.lastSeen = lastSeen;
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
      status,
      statusEmoji,
      updatedAt: new Date(),
    };

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
   * Transform TypeORM entity to domain entity
   */
  private toDomain(entity: UserEntity): User {
    return new User({
      id: entity.id,
      externalId: entity.externalId,
      name: entity.name,
      email: entity.email || undefined,
      avatar: entity.avatar || undefined,
      isOnline: entity.isOnline || false,
      lastSeen: entity.lastSeen || undefined,
      status: entity.status || undefined,
      statusEmoji: entity.statusEmoji || undefined,
    });
  }

  /**
   * Transform domain entity to TypeORM entity
   */
  private toTypeORM(domain: User): UserEntity {
    const entity = new UserEntity();
    entity.id = domain.id;
    entity.externalId = domain.externalId;
    entity.name = domain.name;
    entity.email = domain.email || null;
    entity.avatar = domain.avatar || null;
    entity.isOnline = domain.isOnline;
    entity.lastSeen = domain.lastSeen || null;
    entity.status = domain.status || null;
    entity.statusEmoji = domain.statusEmoji || null;
    entity.createdAt = domain.createdAt || new Date();
    entity.updatedAt = domain.updatedAt || new Date();

    return entity;
  }
}