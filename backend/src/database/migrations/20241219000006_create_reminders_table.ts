import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('reminders', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('wallet_id').nullable().references('id').inTable('wallets').onDelete('CASCADE');
    table.string('title', 255).notNullable();
    table.decimal('amount', 10, 2).notNullable();
    table.enum('type', ['Payment', 'Receivable']).notNullable();
    table.date('due_date').notNullable();
    table.enum('recurrence', ['once', 'daily', 'weekly', 'monthly', 'custom']).notNullable().defaultTo('once');
    table.integer('recurrence_interval').nullable(); // Days for custom recurrence
    table.date('duration_end').nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamps(true, true);

    // Indexes for performance
    table.index(['user_id']);
    table.index(['wallet_id']);
    table.index(['user_id', 'due_date']);
    table.index(['due_date']);
    table.index(['is_active']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('reminders');
}