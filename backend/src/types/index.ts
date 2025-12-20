// User types
export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: 'user' | 'admin';
  wallet_limit: number;
  created_at: Date;
  updated_at: Date;
}

// Wallet types
export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean;
  is_family: boolean;
  created_at: Date;
  updated_at: Date;
}

// Category types
export interface Category {
  id: string;
  user_id: string;
  wallet_id: string | null;
  name: string;
  type: 'Income' | 'Expense';
  created_at: Date;
  updated_at: Date;
}

// Transaction types
export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string;
  category_id: string | null;
  title: string;
  amount: number;
  type: 'Income' | 'Expense';
  created_by: string;
  created_at: Date;
  updated_at: Date;
  is_migrated?: boolean;
  legacy_id?: string;
}

// Budget types
export interface Budget {
  id: string;
  wallet_id: string;
  month: string;
  limit: number;
  created_at: Date;
  updated_at: Date;
}

// Reminder types
export interface Reminder {
  id: string;
  user_id: string;
  wallet_id: string | null;
  title: string;
  amount: number;
  type: 'Payment' | 'Receivable';
  due_date: Date;
  recurrence: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
  recurrence_interval: number | null;
  duration_end: Date | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Family Wallet types
export interface FamilyWalletMember {
  id: string;
  wallet_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: Date;
}

export interface Invitation {
  id: string;
  wallet_id: string;
  inviter_id: string;
  invitee_email: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: Date;
  expires_at: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// JWT Payload type
export interface JWTPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
  iat?: number;
  exp?: number;
}

// Authentication request types
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginRequest {
  emailOrUsername: string;
  password: string;
}

// Authentication response types
export interface AuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
    role: 'user' | 'admin';
    wallet_limit: number;
  };
  token: string;
}

// User management request types
export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role?: 'user' | 'admin';
  wallet_limit?: number;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  role?: 'user' | 'admin';
  wallet_limit?: number;
}

export interface ResetPasswordRequest {
  password: string;
}

// Wallet management request types
export interface CreateWalletRequest {
  name: string;
  is_family?: boolean;
}

export interface UpdateWalletRequest {
  name?: string;
}

// Category management request types
export interface CreateCategoryRequest {
  name: string;
  type: 'Income' | 'Expense';
  wallet_id?: string | null;
}

export interface UpdateCategoryRequest {
  name?: string;
  type?: 'Income' | 'Expense';
}

// Transaction management request types
export interface CreateTransactionRequest {
  title: string;
  amount: number;
  type: 'Income' | 'Expense';
  wallet_id?: string;
  category_id?: string | null;
}

export interface UpdateTransactionRequest {
  title?: string;
  amount?: number;
  type?: 'Income' | 'Expense';
  wallet_id?: string;
  category_id?: string | null;
}

export interface TransactionQueryParams {
  wallet_id?: string;
  category_id?: string;
  type?: 'Income' | 'Expense';
  start_date?: string;
  end_date?: string;
  page?: string;
  limit?: string;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
}

// Budget management request types
export interface CreateBudgetRequest {
  wallet_id: string;
  month: string; // Format: YYYY-MM
  limit: number;
}

export interface UpdateBudgetRequest {
  limit?: number;
}

export interface BudgetStatus {
  budget: Budget;
  total_spent: number;
  remaining: number;
  percentage_used: number;
  status: 'green' | 'yellow' | 'orange' | 'red';
}

// Reminder management request types
export interface CreateReminderRequest {
  title: string;
  amount: number;
  type: 'Payment' | 'Receivable';
  due_date: string; // ISO date string
  recurrence?: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
  recurrence_interval?: number | null; // Days for custom recurrence
  duration_end?: string | null; // ISO date string
  wallet_id?: string | null;
}

export interface UpdateReminderRequest {
  title?: string;
  amount?: number;
  type?: 'Payment' | 'Receivable';
  due_date?: string; // ISO date string
  recurrence?: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
  recurrence_interval?: number | null;
  duration_end?: string | null; // ISO date string
  wallet_id?: string | null;
  is_active?: boolean;
}

export interface ReminderQueryParams {
  wallet_id?: string;
  type?: 'Payment' | 'Receivable';
  is_active?: string;
  upcoming_days?: string;
  overdue?: string;
  page?: string;
  limit?: string;
}

// User response type (without password hash)
export interface UserResponse {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  wallet_limit: number;
  created_at: Date;
  updated_at: Date;
}

// Dashboard types
export interface DashboardSummary {
  total_balance: number;
  monthly_income: number;
  monthly_expense: number;
  budget_status: {
    total_budgets: number;
    budgets_on_track: number;
    budgets_warning: number;
    budgets_over: number;
    overall_status: 'green' | 'yellow' | 'orange' | 'red';
  };
  wallet_count: number;
  transaction_count: number;
}

export interface TransactionReportFilters {
  wallet_id?: string;
  category_id?: string;
  type?: 'Income' | 'Expense';
  start_date?: string;
  end_date?: string;
  page: number;
  limit: number;
}

export interface TransactionReport {
  transactions: Transaction[];
  summary: {
    total_income: number;
    total_expense: number;
    net_amount: number;
    transaction_count: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface CategoryBreakdownFilters {
  wallet_id?: string;
  type?: 'Income' | 'Expense';
  start_date?: string;
  end_date?: string;
}

export interface CategoryBreakdownItem {
  category_id: string | null;
  category_name: string;
  total_amount: number;
  transaction_count: number;
  percentage: number;
}

export interface CategoryBreakdown {
  breakdown: CategoryBreakdownItem[];
  total_amount: number;
  total_transactions: number;
}

export interface TrendsFilters {
  wallet_id?: string;
  period: 'monthly' | 'weekly';
  months: number;
}

export interface TrendDataPoint {
  period: string;
  income: number;
  expense: number;
  net: number;
}

export interface TrendsReport {
  trends: TrendDataPoint[];
  period_type: 'monthly' | 'weekly';
  summary: {
    avg_income: number;
    avg_expense: number;
    avg_net: number;
    total_periods: number;
  };
}

// Chart data types
export interface ChartDataset {
  label?: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartOptions {
  wallet_id?: string;
  period?: 'monthly' | 'weekly';
  months?: number;
  type?: 'Income' | 'Expense';
}

// Migration types
export interface LegacyTransaction {
  id?: string | number; // Legacy ID (will be ignored)
  title: string;
  amount: number;
  created_at: Date | string;
  user_id?: string; // Optional, for manual association
  wallet_id?: string | null; // Optional, for manual association
  category_id?: string | null; // Optional, for manual association
}

export interface MigrationTransaction {
  id: string; // New UUID
  user_id: string;
  wallet_id: string;
  category_id: string | null;
  title: string;
  amount: number;
  type: 'Income' | 'Expense';
  created_by: string;
  created_at: Date;
  updated_at: Date;
  is_migrated: boolean;
  legacy_id?: string | number; // Reference to original legacy ID
}

export interface MigrationStatus {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  total_records: number;
  processed_records: number;
  successful_records: number;
  failed_records: number;
  error_message?: string;
  started_at: Date;
  completed_at?: Date;
  created_by: string;
}

export interface MigrationRequest {
  legacy_data: LegacyTransaction[];
  default_user_id?: string; // User to assign transactions to if not specified
  default_type?: 'Income' | 'Expense'; // Default transaction type
}

export interface MigrationResult {
  migration_id: string;
  status: 'completed' | 'partial' | 'failed';
  total_records: number;
  successful_records: number;
  failed_records: number;
  errors: Array<{
    record_index: number;
    legacy_id?: string | number;
    error: string;
  }>;
}

export interface PostMigrationAssociationRequest {
  transaction_id: string;
  user_id?: string;
  wallet_id?: string;
  category_id?: string | null;
}