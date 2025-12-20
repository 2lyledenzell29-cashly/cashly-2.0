'use client';

import React, { useState } from 'react';
import { Invitation } from '@/types';

interface InvitationCardProps {
  invitation: Invitation;
  onAccept: (invitationId: string) => Promise<void>;
  onDecline: (invitationId: string) => Promise<void>;
  loading?: boolean;
}

const InvitationCard: React.FC<InvitationCardProps> = ({
  invitation,
  onAccept,
  onDecline,
  loading = false,
}) => {
  const [actionLoading, setActionLoading] = useState<'accept' | 'decline' | null>(null);

  const handleAccept = async () => {
    try {
      setActionLoading('accept');
      await onAccept(invitation.id);
    } catch (error) {
      // Error is handled by the parent component
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async () => {
    try {
      setActionLoading('decline');
      await onDecline(invitation.id);
    } catch (error) {
      // Error is handled by the parent component
    } finally {
      setActionLoading(null);
    }
  };

  const isExpired = new Date(invitation.expires_at) < new Date();
  const daysUntilExpiry = Math.ceil(
    (new Date(invitation.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-2 border-blue-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">Family Wallet Invitation</h3>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <span className="font-medium">Invited to:</span> Family Wallet
            </p>
            <p>
              <span className="font-medium">Received:</span>{' '}
              {new Date(invitation.created_at).toLocaleDateString()}
            </p>
            {!isExpired && (
              <p>
                <span className="font-medium">Expires in:</span>{' '}
                <span className={daysUntilExpiry <= 3 ? 'text-red-600 font-medium' : ''}>
                  {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}
                </span>
              </p>
            )}
          </div>

          {isExpired && (
            <div className="mt-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Expired
            </div>
          )}
        </div>
      </div>

      {!isExpired && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex gap-3">
            <button
              onClick={handleAccept}
              disabled={loading || actionLoading !== null}
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {actionLoading === 'accept' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Accepting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Accept
                </>
              )}
            </button>
            <button
              onClick={handleDecline}
              disabled={loading || actionLoading !== null}
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
            >
              {actionLoading === 'decline' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
                  Declining...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Decline
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvitationCard;