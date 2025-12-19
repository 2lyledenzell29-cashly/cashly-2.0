import { ApiResponse, Wallet, FamilyWalletMember, Invitation } from '@/types';
import { AuthService } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface CreateFamilyWalletRequest {
  name: string;
}

export interface InviteToFamilyWalletRequest {
  inviteeEmail: string;
}

/**
 * Get authentication headers for API requests
 */
const getAuthHeaders = (): Record<string, string> => {
  const token = AuthService.getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

/**
 * Create a new family wallet
 */
export const createFamilyWallet = async (data: CreateFamilyWalletRequest): Promise<Wallet> => {
  const response = await fetch(`${API_BASE_URL}/family-wallets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });

  const result: ApiResponse<Wallet> = await response.json();

  if (!result.success) {
    throw new Error(result.error?.message || 'Failed to create family wallet');
  }

  return result.data!;
};

/**
 * Get user's family wallets
 */
export const getUserFamilyWallets = async (): Promise<Wallet[]> => {
  const response = await fetch(`${API_BASE_URL}/family-wallets/user`, {
    method: 'GET',
    headers: {
      ...getAuthHeaders(),
    },
  });

  const result: ApiResponse<Wallet[]> = await response.json();

  if (!result.success) {
    throw new Error(result.error?.message || 'Failed to fetch family wallets');
  }

  return result.data || [];
};

/**
 * Get family wallet members
 */
export const getFamilyWalletMembers = async (walletId: string): Promise<FamilyWalletMember[]> => {
  const response = await fetch(`${API_BASE_URL}/family-wallets/${walletId}/members`, {
    method: 'GET',
    headers: {
      ...getAuthHeaders(),
    },
  });

  const result: ApiResponse<FamilyWalletMember[]> = await response.json();

  if (!result.success) {
    throw new Error(result.error?.message || 'Failed to fetch family wallet members');
  }

  return result.data || [];
};

/**
 * Invite user to family wallet
 */
export const inviteToFamilyWallet = async (
  walletId: string, 
  data: InviteToFamilyWalletRequest
): Promise<Invitation> => {
  const response = await fetch(`${API_BASE_URL}/family-wallets/${walletId}/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });

  const result: ApiResponse<Invitation> = await response.json();

  if (!result.success) {
    throw new Error(result.error?.message || 'Failed to send invitation');
  }

  return result.data!;
};

/**
 * Get family wallet invitations (for owners)
 */
export const getFamilyWalletInvitations = async (walletId: string): Promise<Invitation[]> => {
  const response = await fetch(`${API_BASE_URL}/family-wallets/${walletId}/invitations`, {
    method: 'GET',
    headers: {
      ...getAuthHeaders(),
    },
  });

  const result: ApiResponse<Invitation[]> = await response.json();

  if (!result.success) {
    throw new Error(result.error?.message || 'Failed to fetch invitations');
  }

  return result.data || [];
};

/**
 * Remove family wallet member
 */
export const removeFamilyWalletMember = async (
  walletId: string, 
  memberId: string
): Promise<boolean> => {
  const response = await fetch(`${API_BASE_URL}/family-wallets/${walletId}/members/${memberId}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders(),
    },
  });

  const result: ApiResponse<{ removed: boolean }> = await response.json();

  if (!result.success) {
    throw new Error(result.error?.message || 'Failed to remove member');
  }

  return result.data?.removed || false;
};

/**
 * Get user's pending invitations
 */
export const getUserPendingInvitations = async (): Promise<Invitation[]> => {
  const response = await fetch(`${API_BASE_URL}/family-wallets/invitations/pending`, {
    method: 'GET',
    headers: {
      ...getAuthHeaders(),
    },
  });

  const result: ApiResponse<Invitation[]> = await response.json();

  if (!result.success) {
    throw new Error(result.error?.message || 'Failed to fetch pending invitations');
  }

  return result.data || [];
};

/**
 * Accept family wallet invitation
 */
export const acceptInvitation = async (invitationId: string): Promise<FamilyWalletMember> => {
  const response = await fetch(`${API_BASE_URL}/family-wallets/invitations/${invitationId}/accept`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
    },
  });

  const result: ApiResponse<FamilyWalletMember> = await response.json();

  if (!result.success) {
    throw new Error(result.error?.message || 'Failed to accept invitation');
  }

  return result.data!;
};

/**
 * Decline family wallet invitation
 */
export const declineInvitation = async (invitationId: string): Promise<Invitation> => {
  const response = await fetch(`${API_BASE_URL}/family-wallets/invitations/${invitationId}/decline`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
    },
  });

  const result: ApiResponse<Invitation> = await response.json();

  if (!result.success) {
    throw new Error(result.error?.message || 'Failed to decline invitation');
  }

  return result.data!;
};