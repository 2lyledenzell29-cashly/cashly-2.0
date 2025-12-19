import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('categories', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('wallet_id').nullable().references('id').inTable('wallets').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.enum('type', ['Income', 'Expense']).notNullable();
    table.timestamps(true, true);

    // Indexes for performance
    table.index(['user_id']);
    table.index(['wallet_id']);
    table.index(['user_id', 'type']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('categories');
}