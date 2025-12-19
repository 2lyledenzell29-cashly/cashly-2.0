const knex = require('knex');
const knexConfig = require('../knexfile');

async function runMigration() {
  const environment = process.env.NODE_ENV || 'development';
  const config = knexConfig[environment];
  const db = knex(config);

  try {
    console.log('🚀 Starting migration from old transactions table...');
    
    // Step 1: Create placeholder user if it doesn't exist
    console.log('📝 Step 1: Creating placeholder user...');
    try {
      await db.raw(`
        INSERT INTO users (id, username, email, password_hash, role, wallet_limit)
        VALUES (
          '00000000-0000-0000-0000-000000000001'::uuid,
          'placeholder_user',
          'placeholder@migration.local',
          '$2b$10$placeholder.hash.for.migration.user.only',
          'user',
          999
        ) ON CONFLICT (id) DO NOTHING
      `);
      console.log('✅ Placeholder user created/verified');
    } catch (error) {
      console.error('❌ Error creating placeholder user:', error.message);
      throw error;
    }

    // Step 2: Create placeholder wallet if it doesn't exist
    console.log('📝 Step 2: Creating placeholder wallet...');
    try {
      await db.raw(`
        INSERT INTO wallets (id, user_id, name, is_default, is_family)
        VALUES (
          '11111111-1111-1111-1111-111111111111'::uuid,
          '00000000-0000-0000-0000-000000000001'::uuid,
          'Migrated Transactions Wallet',
          true,
          false
        ) ON CONFLICT (id) DO NOTHING
      `);
      console.log('✅ Placeholder wallet created/verified');
    } catch (error) {
      console.error('❌ Error creating placeholder wallet:', error.message);
      throw error;
    }

    // Step 3: Check if old transactions table exists
    console.log('📝 Step 3: Checking for old transactions table...');
    let oldTableExists = false;
    try {
      const result = await db.raw(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'transactions'
        )
      `);
      oldTableExists = result.rows[0].exists;
      console.log(`ℹ️  Old transactions table exists: ${oldTableExists}`);
    } catch (error) {
      console.log('ℹ️  Could not check for old transactions table');
    }

    if (!oldTableExists) {
      console.log('ℹ️  No old transactions table found. Migration not needed.');
      return;
    }

    // Step 4: Count existing transactions in old table for specific user
    console.log('📝 Step 4: Counting transactions in old table for specific user...');
    const countResult = await db.raw(`SELECT COUNT(*) as count FROM transactions WHERE user_id = 'user_33hIcBiQAQkqJgNOSKoJ5tMTjIz'`);
    const totalTransactions = parseInt(countResult.rows[0].count);
    console.log(`📊 Found ${totalTransactions} transactions to migrate for user user_33hIcBiQAQkqJgNOSKoJ5tMTjIz`);

    if (totalTransactions === 0) {
      console.log('ℹ️  No transactions to migrate.');
      return;
    }

    // Step 5: Migrate transactions from old table to new table
    console.log('📝 Step 5: Migrating transactions...');
    try {
      const migrationResult = await db.raw(`
        INSERT INTO transactions_2_0 (
          user_id, 
          wallet_id, 
          category_id,
          type, 
          title, 
          amount, 
          created_at,
          created_by,
          is_migrated,
          legacy_id
        )
        SELECT
          '00000000-0000-0000-0000-000000000001'::uuid AS user_id,
          '11111111-1111-1111-1111-111111111111'::uuid AS wallet_id,
          NULL AS category_id,
          CASE 
            WHEN amount >= 0 THEN 'Expense'
            ELSE 'Income'
          END AS type,
          COALESCE(title, 'Migrated Transaction') AS title,
          ABS(amount) AS amount,
          created_at,
          '00000000-0000-0000-0000-000000000001'::uuid AS created_by,
          true AS is_migrated,
          COALESCE(id::text, user_id::text || '_' || created_at::text) AS legacy_id
        FROM transactions
        WHERE user_id = 'user_33hIcBiQAQkqJgNOSKoJ5tMTjIz'
          AND NOT EXISTS (
            SELECT 1 
            FROM transactions_2_0 t2 
            WHERE t2.legacy_id = transactions.id::text
          )
      `);
      
      const migratedCount = migrationResult.rowCount || 0;
      console.log(`✅ Successfully migrated ${migratedCount} transactions`);
    } catch (error) {
      console.error('❌ Error migrating transactions:', error.message);
      throw error;
    }

    // Step 6: Show migration results
    console.log('📝 Step 6: Showing migration results...');
    const resultQuery = await db.raw(`
      SELECT 
        'Migration completed' AS status,
        COUNT(*) AS total_migrated_transactions
      FROM transactions_2_0 
      WHERE is_migrated = true
    `);
    console.log('📊 Migration Results:', resultQuery.rows[0]);

    // Step 7: Show sample of migrated data
    console.log('📝 Step 7: Showing sample migrated data...');
    const sampleQuery = await db.raw(`
      SELECT 
        id,
        title,
        amount,
        type,
        created_at,
        is_migrated,
        legacy_id
      FROM transactions_2_0 
      WHERE is_migrated = true 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    if (sampleQuery.rows.length > 0) {
      console.log('📊 Sample migrated transactions:');
      sampleQuery.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.title} - $${row.amount} (${row.type}) - ${row.created_at}`);
      });
    }

    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

runMigration();