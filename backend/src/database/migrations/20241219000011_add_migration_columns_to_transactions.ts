import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('transactions_2_0', (table) => {
    table.boolean('is_migrated').notNullable().defaultTo(false);
    table.string('legacy_id').nullable(); // Store original legacy ID for reference
    
    // Index for migration queries
    table.index(['is_migrated']);
    table.index(['legacy_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('transactions_2_0', (table) => {
    table.dropIndex(['is_migrated']);
    table.dropIndex(['legacy_id']);
    table.dropColumn('is_migrated');
    table.dropColumn('legacy_id');
  });
}