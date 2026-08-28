'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import { UserPlus, UserCheck, UserMinus, Loader2 } from 'lucide-react';

interface FollowButtonProps {
  username: string;
  initialIsFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean, followersCountDiff: number) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function FollowButton({
  username,
  initialIsFollowing = false,
  onFollowChange,
  size = 'md',
  className = '',
}: FollowButtonProps) {
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAuthStore();

  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Do not render follow button for own profile
  if (currentUser && currentUser.username.toLowerCase() === username.toLowerCase()) {
    return null;
  }

  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const previousState = isFollowing;
    const nextState = !previousState;
    const countDiff = nextState ? 1 : -1;

    // 1. Optimistic state update
    setIsFollowing(nextState);
    if (onFollowChange) {
      onFollowChange(nextState, countDiff);
    }

    setIsLoading(true);

    try {
      if (nextState) {
        await apiClient.post(`/users/${username}/follow`);
      } else {
        await apiClient.delete(`/users/${username}/follow`);
      }
    } catch {
      // Rollback on error
      setIsFollowing(previousState);
      if (onFollowChange) {
        onFollowChange(previousState, -countDiff);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses =
    size === 'sm' ? 'px-3 py-1 text-xs rounded-lg' : 'px-5 py-2 text-sm rounded-xl';

  if (isFollowing) {
    return (
      <button
        onClick={handleToggleFollow}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={isLoading}
        className={`font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${sizeClasses} ${
          isHovered
            ? 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/20'
            : 'bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600'
        } ${className}`}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isHovered ? (
          <>
            <UserMinus className="w-3.5 h-3.5" />
            Unfollow
          </>
        ) : (
          <>
            <UserCheck className="w-3.5 h-3.5 text-blue-400" />
            Following
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleFollow}
      disabled={isLoading}
      className={`font-semibold bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${sizeClasses} ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <>
          <UserPlus className="w-3.5 h-3.5" />
          Follow
        </>
      )}
    </button>
  );
}
