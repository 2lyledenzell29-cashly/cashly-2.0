// User types
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  wallet_limit: number;
  created_at: string;
  updated_at: string;
}

// Wallet types
export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean;
  is_family: boolean;
  created_at: string;
  updated_at: string;
}

// Category types
export interface Category {
  id: string;
  user_id: string;
  wallet_id: string | null;
  name: string;
  type: 'Income' | 'Expense';
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
}

// Budget types
export interface Budget {
  id: string;
  wallet_id: string;
  month: string;
  limit: number;
  created_at: string;
  updated_at: string;
}

// Reminder types
export interface Reminder {
  id: string;
  user_id: string;
  wallet_id: string | null;
  title: string;
  amount: number;
  type: 'Payment' | 'Receivable';
  due_date: string;
  recurrence: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
  recurrence_interval: number | null;
  duration_end: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Family Wallet types
export interface FamilyWalletMember {
  id: string;
  wallet_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
}

export interface Invitation {
  id: string;
  wallet_id: string;
  inviter_id: string;
  invitee_email: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  expires_at: string;
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

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Auth context types
export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterForm) => Promise<void>;
  logout: () => void;
  loading: boolean;
}