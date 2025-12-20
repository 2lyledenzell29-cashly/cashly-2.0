'use client';

import React, { useState, useEffect } from 'react';
import { Wallet, FamilyWalletMember, Invitation } from '@/types';
import { useFamilyWallet } from '@/contexts/FamilyWalletContext';
import { useAuth } from '@/contexts/AuthContext';
import InvitationForm from './InvitationForm';

interface FamilyWalletMembersProps {
  wallet: Wallet;
  onClose: () => void;
}

const FamilyWalletMembers: React.FC<FamilyWalletMembersProps> = ({ wallet, onClose }) => {
  const { user } = useAuth();
  const { 
    getFamilyWalletMembers, 
    getFamilyWalletInvitations,
    inviteToFamilyWallet, 
    removeFamilyWalletMember,
    error,
    clearError 
  } = useFamilyWallet();
  
  const [members, setMembers] = useState<FamilyWalletMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const isOwner = wallet.user_id === user?.id;

  useEffect(() => {
    loadData();
  }, [wallet.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      clearError();
      
      const [membersData, invitationsData] = await Promise.all([
        getFamilyWalletMembers(wallet.id),
        isOwner ? getFamilyWalletInvitations(wallet.id) : Promise.resolve([])
      ]);
      
      setMembers(membersData);
      setInvitations(invitationsData);
    } catch (error) {
      console.error('Failed to load family wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (email: string) => {
    try {
      await inviteToFamilyWallet(wallet.id, email);
      setShowInviteForm(false);
      // Reload invitations to show the new one
      if (isOwner) {
        const invitationsData = await getFamilyWalletInvitations(wallet.id);
        setInvitations(invitationsData);
      }
    } catch (error) {
      // Error is handled by the context
      throw error;
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!window.confirm('Are you sure you want to remove this member from the family wallet?')) {
      return;
    }

    try {
      setRemovingMemberId(memberId);
      await removeFamilyWalletMember(wallet.id, memberId);
      // Reload members to reflect the change
      const membersData = await getFamilyWalletMembers(wallet.id);
      setMembers(membersData);
    } catch (error) {
      console.error('Failed to remove member:', error);
    } finally {
      setRemovingMemberId(null);
    }
  };

  const getRoleDisplay = (role: string) => {
    return role === 'owner' ? 'Owner' : 'Member';
  };

  const getRoleBadgeColor = (role: string) => {
    return role === 'owner' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  const getInvitationStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-medium text-gray-900">
                Family Wallet Members
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Manage members for "{wallet.name}"
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={clearError}
                    className="text-red-400 hover:text-red-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Current Members */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-900">
                    Current Members ({members.length})
                  </h4>
                  {isOwner && (
                    <button
                      onClick={() => setShowInviteForm(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Invite Member
                    </button>
                  )}
                </div>

                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {members.map((member) => (
                      <li key={member.id}>
                        <div className="px-4 py-4 flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-900">
                                  User ID: {member.user_id}
                                </p>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                                  {getRoleDisplay(member.role)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500">
                                Joined {new Date(member.joined_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          {isOwner && member.role !== 'owner' && (
                            <button
                              onClick={() => handleRemoveMember(member.user_id)}
                              disabled={removingMemberId === member.user_id}
                              className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                            >
                              {removingMemberId === member.user_id ? 'Removing...' : 'Remove'}
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Pending Invitations (Owner only) */}
              {isOwner && invitations.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    Pending Invitations ({invitations.filter(inv => inv.status === 'pending').length})
                  </h4>

                  <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                      {invitations.map((invitation) => (
                        <li key={invitation.id}>
                          <div className="px-4 py-4 flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-gray-900">
                                    {invitation.invitee_email}
                                  </p>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getInvitationStatusColor(invitation.status)}`}>
                                    {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-500">
                                  Sent {new Date(invitation.created_at).toLocaleDateString()}
                                  {invitation.status === 'pending' && (
                                    <span className="ml-2">
                                      • Expires {new Date(invitation.expires_at).toLocaleDateString()}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Invitation Form Modal */}
      {showInviteForm && (
        <InvitationForm
          wallet={wallet}
          onSubmit={handleInvite}
          onCancel={() => setShowInviteForm(false)}
          loading={loading}
        />
      )}
    </div>
  );
};

export default FamilyWalletMembers;