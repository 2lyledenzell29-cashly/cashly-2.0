import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('budgets', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('wallet_id').notNullable().references('id').inTable('wallets').onDelete('CASCADE');
    table.string('month', 7).notNullable(); // Format: YYYY-MM
    table.decimal('limit', 10, 2).notNullable();
    table.timestamps(true, true);

    // Composite unique index for wallet_id and month
    table.unique(['wallet_id', 'month']);
    
    // Indexes for performance
    table.index(['wallet_id']);
    table.index(['month']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('budgets');
}