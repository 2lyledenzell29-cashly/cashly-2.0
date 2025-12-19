require('dotenv').config();
require('ts-node/register');

module.exports = {
  development: {
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
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
  },

  test: {
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL_TEST || process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
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
  },

  production: {
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
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
  }
};