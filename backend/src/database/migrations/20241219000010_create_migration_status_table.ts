import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('migration_status', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.enum('status', ['pending', 'in_progress', 'completed', 'failed']).notNullable().defaultTo('pending');
    table.integer('total_records').notNullable().defaultTo(0);
    table.integer('processed_records').notNullable().defaultTo(0);
    table.integer('successful_records').notNullable().defaultTo(0);
    table.integer('failed_records').notNullable().defaultTo(0);
    table.text('error_message').nullable();
    table.timestamp('started_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('completed_at').nullable();
    table.uuid('created_by').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.timestamps(true, true);

    // Indexes
    table.index(['status']);
    table.index(['created_by']);
    table.index(['started_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('migration_status');
}