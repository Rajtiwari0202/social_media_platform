'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { UserSummaryDTO } from '@social/shared';
import { FollowButton } from './follow-button';
import {
  X,
  Search,
  Users,
  Loader2,
  BadgeCheck,
} from 'lucide-react';

interface UsersListModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  type: 'followers' | 'following';
}

export function UsersListModal({ isOpen, onClose, username, type }: UsersListModalProps) {
  const [users, setUsers] = useState<UserSummaryDTO[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchUsers = useCallback(
    async (cursor?: string, search?: string, isInitial = false) => {
      if (isInitial) setIsLoading(true);
      else setIsLoadingMore(true);

      try {
        const endpoint = type === 'followers' ? `/users/${username}/followers` : `/users/${username}/following`;
        const params: Record<string, string | number> = { limit: 20 };
        if (cursor) params.cursor = cursor;
        if (search) params.search = search;

        const res = await apiClient.get(endpoint, { params });
        const { data, pagination } = res.data;

        if (isInitial) {
          setUsers(data);
        } else {
          setUsers((prev) => [...prev, ...data]);
        }

        setNextCursor(pagination.nextCursor);
        setHasNextPage(pagination.hasNextPage);
      } catch {
        if (isInitial) setUsers([]);
      } finally {
        if (isInitial) setIsLoading(false);
        else setIsLoadingMore(false);
      }
    },
    [username, type]
  );

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      fetchUsers(undefined, undefined, true);
    }
  }, [isOpen, fetchUsers]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    fetchUsers(undefined, val.trim() || undefined, true);
  };

  const handleLoadMore = () => {
    if (nextCursor && !isLoadingMore) {
      fetchUsers(nextCursor, searchQuery.trim() || undefined, false);
    }
  };

  if (!isOpen) return null;

  const title = type === 'followers' ? 'Followers' : 'Following';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">{title}</h3>
              <p className="text-xs text-slate-400">@{username}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-950/40">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder={`Search ${title.toLowerCase()}...`}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-slate-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* User List Body */}
        <div className="flex-1 overflow-y-auto p-3 divide-y divide-slate-800/50">
          {isLoading ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No {title.toLowerCase()} found</p>
              {searchQuery && <p className="text-xs text-slate-600 mt-1">Try another search query</p>}
            </div>
          ) : (
            users.map((userItem) => (
              <div
                key={userItem.id}
                className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-slate-800/30 rounded-xl transition-colors"
              >
                <Link
                  href={`/${userItem.username}`}
                  onClick={onClose}
                  className="flex items-center gap-3 min-w-0 flex-1 group"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm uppercase flex-shrink-0 shadow overflow-hidden">
                    {userItem.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={userItem.avatarUrl} alt={userItem.displayName} className="w-full h-full object-cover" />
                    ) : (
                      userItem.displayName[0]
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
                        {userItem.displayName}
                      </span>
                      {userItem.isVerified && (
                        <BadgeCheck className="w-3.5 h-3.5 text-blue-400 fill-blue-400/20 flex-shrink-0" />
                      )}
                    </div>
                    <div className="text-xs text-slate-400 truncate">@{userItem.username}</div>
                    {userItem.bio && (
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{userItem.bio}</p>
                    )}
                  </div>
                </Link>

                <div className="flex-shrink-0">
                  <FollowButton
                    username={userItem.username}
                    initialIsFollowing={userItem.isFollowing}
                    size="sm"
                  />
                </div>
              </div>
            ))
          )}

          {/* Load More Button */}
          {hasNextPage && !isLoading && (
            <div className="pt-3 pb-1 text-center">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors py-1.5 px-4 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
