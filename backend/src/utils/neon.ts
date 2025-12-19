import { neon, neonConfig } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

// Configure Neon for optimal performance
neonConfig.fetchConnectionCache = true;

// Create the SQL function for direct queries
export const sql = neon(process.env.DATABASE_URL!);

// Helper function for transactions with Neon
export async function withTransaction<T>(
  callback: (sql: any) => Promise<T>
): Promise<T> {
  // Note: Neon serverless doesn't support traditional transactions
  // Each query is automatically committed
  // For complex operations, consider using application-level transaction logic
  return await callback(sql);
}

// Helper function to check database connection
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const result = await sql`SELECT 1 as connected`;
    return result.length > 0 && result[0].connected === 1;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Helper function to get database info
export async function getDatabaseInfo() {
  try {
    const result = await sql`
      SELECT 
        current_database() as database_name,
        current_user as user_name,
        version() as version
    `;
    return result[0];
  } catch (error) {
    console.error('Failed to get database info:', error);
    return null;
  }
}