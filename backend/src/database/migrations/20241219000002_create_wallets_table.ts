import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('wallets', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.boolean('is_default').notNullable().defaultTo(false);
    table.boolean('is_family').notNullable().defaultTo(false);
    table.timestamps(true, true);

    // Indexes for performance
    table.index(['user_id']);
    table.index(['user_id', 'is_default']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('wallets');
}