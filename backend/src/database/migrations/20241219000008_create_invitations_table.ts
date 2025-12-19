import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('invitations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('wallet_id').notNullable().references('id').inTable('wallets').onDelete('CASCADE');
    table.uuid('inviter_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('invitee_email', 255).notNullable();
    table.enum('status', ['pending', 'accepted', 'declined']).notNullable().defaultTo('pending');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('expires_at').notNullable();

    // Indexes for performance
    table.index(['wallet_id']);
    table.index(['inviter_id']);
    table.index(['invitee_email']);
    table.index(['status']);
    table.index(['expires_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('invitations');
}