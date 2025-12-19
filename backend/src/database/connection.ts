import knex, { Knex } from 'knex';
const knexConfig = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment as keyof typeof knexConfig];

// Create the database connection
const db: Knex = knex(config);

export default db;

// Database utility functions
export class DatabaseUtils {
  static async testConnection(): Promise<boolean> {
    try {
      await db.raw('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }

  static async closeConnection(): Promise<void> {
    await db.destroy();
  }

  static getKnexInstance(): Knex {
    return db;
  }
}