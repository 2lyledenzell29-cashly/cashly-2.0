import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('transactions_2_0', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('wallet_id').notNullable().references('id').inTable('wallets').onDelete('CASCADE');
    table.uuid('category_id').nullable().references('id').inTable('categories').onDelete('SET NULL');
    table.string('title', 255).notNullable();
    table.decimal('amount', 10, 2).notNullable();
    table.enum('type', ['Income', 'Expense']).notNullable();
    table.uuid('created_by').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.timestamps(true, true);

    // Indexes for performance optimization
    table.index(['user_id']);
    table.index(['wallet_id']);
    table.index(['category_id']);
    table.index(['created_at']);
    table.index(['user_id', 'created_at']);
    table.index(['wallet_id', 'created_at']);
    table.index(['type']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('transactions_2_0');
}