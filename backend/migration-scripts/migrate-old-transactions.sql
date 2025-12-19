-- Migration script to move data from old 'transactions' table to new 'transactions_2_0' table
-- Run this script as a database admin

-- Step 1: Create placeholder user if it doesn't exist
INSERT INTO users (id, username, email, password_hash, role, wallet_limit)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'placeholder_user',
  'placeholder@migration.local',
  '$2b$10$placeholder.hash.for.migration.user.only',
  'user',
  999
) ON CONFLICT (id) DO NOTHING;

-- Step 2: Create placeholder wallet if it doesn't exist
INSERT INTO wallets (id, user_id, name, is_default, is_family)
VALUES (
  '11111111-1111-1111-1111-111111111111'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Migrated Transactions Wallet',
  true,
  false
) ON CONFLICT (id) DO NOTHING;

-- Step 3: Migrate transactions from old table to new table for specific user
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
  );

-- Step 4: Show migration results
SELECT 
  'Migration completed' AS status,
  COUNT(*) AS total_migrated_transactions
FROM transactions_2_0 
WHERE is_migrated = true;

-- Step 5: Show sample of migrated data
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
LIMIT 10;