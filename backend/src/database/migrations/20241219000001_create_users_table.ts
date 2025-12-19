import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('username', 255).notNullable().unique();
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.enum('role', ['user', 'admin']).notNullable().defaultTo('user');
    table.integer('wallet_limit').notNullable().defaultTo(1);
    table.timestamps(true, true);

    // Indexes for performance
    table.index(['email']);
    table.index(['username']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('users');
}