import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('family_wallet_members', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('wallet_id').notNullable().references('id').inTable('wallets').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.enum('role', ['owner', 'member']).notNullable().defaultTo('member');
    table.timestamp('joined_at').notNullable().defaultTo(knex.fn.now());

    // Composite unique index to prevent duplicate memberships
    table.unique(['wallet_id', 'user_id']);
    
    // Indexes for performance
    table.index(['wallet_id']);
    table.index(['user_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('family_wallet_members');
}