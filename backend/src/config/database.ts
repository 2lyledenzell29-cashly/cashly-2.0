import knex from 'knex';
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

// Create Neon connection
const sql = neon(process.env.DATABASE_URL!);

const config = {
  client: 'pg',
  connection: async () => {
    // For Neon serverless, we use the connection string directly
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    };
  },
  migrations: {
    directory: './src/database/migrations',
    extension: 'ts'
  },
  seeds: {
    directory: './src/database/seeds'
  },
  pool: {
    min: 0,
    max: 1
  }
};

const db = knex(config);

// Export both knex instance and raw Neon SQL function
export { sql };
export default db;