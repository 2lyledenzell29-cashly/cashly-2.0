import { Knex } from 'knex';
import db from '../database/connection';

export abstract class BaseRepository<T> {
  protected db: Knex;
  protected tableName: string;

  constructor(tableName: string) {
    this.db = db;
    this.tableName = tableName;
  }

  // Generic CRUD operations
  async findById(id: string): Promise<T | null> {
    const result = await this.db(this.tableName).where({ id }).first();
    return result || null;
  }

  async findAll(filters?: Partial<T>): Promise<T[]> {
    let query = this.db(this.tableName);
    
    if (filters) {
      query = query.where(filters);
    }
    
    return query.select('*');
  }

  async create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    const [result] = await this.db(this.tableName)
      .insert(data)
      .returning('*');
    return result;
  }

  async update(id: string, data: Partial<Omit<T, 'id' | 'created_at'>>): Promise<T | null> {
    const [result] = await this.db(this.tableName)
      .where({ id })
      .update({ ...data, updated_at: new Date() })
      .returning('*');
    return result || null;
  }

  async delete(id: string): Promise<boolean> {
    const deletedRows = await this.db(this.tableName).where({ id }).del();
    return deletedRows > 0;
  }

  async exists(id: string): Promise<boolean> {
    const result = await this.db(this.tableName)
      .where({ id })
      .select('id')
      .first();
    return !!result;
  }

  async count(filters?: Partial<T>): Promise<number> {
    let query = this.db(this.tableName);
    
    if (filters) {
      query = query.where(filters);
    }
    
    const result = await query.count('* as count').first();
    return parseInt(result?.count as string) || 0;
  }

  // Pagination helper
  async findWithPagination(
    page: number = 1,
    limit: number = 10,
    filters?: Partial<T>,
    orderBy?: { column: string; direction: 'asc' | 'desc' }
  ): Promise<{ data: T[]; total: number; page: number; limit: number }> {
    const offset = (page - 1) * limit;
    
    let query = this.db(this.tableName);
    let countQuery = this.db(this.tableName);
    
    if (filters) {
      query = query.where(filters);
      countQuery = countQuery.where(filters);
    }
    
    if (orderBy) {
      query = query.orderBy(orderBy.column, orderBy.direction);
    }
    
    const [data, totalResult] = await Promise.all([
      query.select('*').limit(limit).offset(offset),
      countQuery.count('* as count').first()
    ]);
    
    const total = parseInt(totalResult?.count as string) || 0;
    
    return {
      data,
      total,
      page,
      limit
    };
  }
}