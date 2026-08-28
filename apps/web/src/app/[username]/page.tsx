'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import { ProfileDTO } from '@social/shared';
import {
  Calendar,
  MapPin,
  Link as LinkIcon,
  BadgeCheck,
  Edit3,
  UserPlus,
  UserCheck,
  Layers,
  FileText,
  Image as ImageIcon,
  Heart,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface PublicProfile extends ProfileDTO {
  username: string;
  isVerified: boolean;
  isPrivate: boolean;
}

export default function ProfilePage() {
  const params = useParams();
  const rawUsername = params.username as string;
  const username = rawUsername?.startsWith('%40') || rawUsername?.startsWith('@')
    ? decodeURIComponent(rawUsername).replace('@', '')
    : rawUsername;

  const { user: currentUser, isAuthenticated } = useAuthStore();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'media' | 'likes'>('posts');

  const isOwnProfile = currentUser && currentUser.username.toLowerCase() === username.toLowerCase();

  useEffect(() => {
    if (!username) return;
    setIsLoading(true);
    setError(null);

    apiClient
      .get(`/users/${username}`)
      .then((res) => {
        setProfile(res.data.data);
      })
      .catch((err) => {
        setError(err.response?.data?.detail || 'User profile not found.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [username]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex p-4 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">User Not Found</h2>
        <p className="text-slate-400 text-sm mb-6">{error || 'This account does not exist or has been deactivated.'}</p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-600/20"
        >
          Return Home
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(profile.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Profile Header Card */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-2xl">
        {/* Banner */}
        <div className="h-44 sm:h-56 w-full bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 relative">
          {profile.bannerUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
          )}
        </div>

        {/* Profile Info Section */}
        <div className="px-6 pb-6 pt-0 relative">
          {/* Avatar & Action Button Bar */}
          <div className="flex justify-between items-end -mt-16 sm:-mt-20 mb-4">
            <div className="relative">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-[#090a0f] bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-3xl uppercase shadow-xl overflow-hidden">
                {profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                ) : (
                  profile.displayName[0]
                )}
              </div>
            </div>

            <div>
              {isOwnProfile ? (
                <Link
                  href="/settings/profile"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition-all"
                >
                  <Edit3 className="w-4 h-4 text-blue-400" />
                  Edit Profile
                </Link>
              ) : (
                <button
                  onClick={() => alert('Follow/Unfollow will be activated in Phase 2!')}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
                >
                  {profile.isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Follow
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Name & Handle */}
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              {profile.displayName}
              {profile.isVerified && <BadgeCheck className="w-5 h-5 text-blue-400 fill-blue-400/20" />}
            </h1>
            <p className="text-sm text-slate-400">@{profile.username}</p>
          </div>

          {/* Bio */}
          {profile.bio && <p className="text-slate-300 text-sm mt-3 leading-relaxed">{profile.bio}</p>}

          {/* Meta (Location, Website, Joined) */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-4">
            {profile.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>{profile.location}</span>
              </div>
            )}
            {profile.website && (
              <div className="flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
                <a
                  href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  {profile.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Joined {formattedDate}</span>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-6 mt-5 pt-4 border-t border-slate-800 text-sm">
            <div>
              <span className="font-bold text-white">{profile.postsCount}</span>{' '}
              <span className="text-slate-400">Posts</span>
            </div>
            <div>
              <span className="font-bold text-white">{profile.followingCount}</span>{' '}
              <span className="text-slate-400">Following</span>
            </div>
            <div>
              <span className="font-bold text-white">{profile.followersCount}</span>{' '}
              <span className="text-slate-400">Followers</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-t border-slate-800 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-all cursor-pointer ${
              activeTab === 'posts'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab('replies')}
            className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-all cursor-pointer ${
              activeTab === 'replies'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Replies
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-all cursor-pointer ${
              activeTab === 'media'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Media
          </button>
          <button
            onClick={() => setActiveTab('likes')}
            className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-all cursor-pointer ${
              activeTab === 'likes'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Likes
          </button>
        </div>
      </div>

      {/* Feed Placeholder Section */}
      <div className="mt-6 p-12 text-center rounded-2xl bg-slate-900/30 border border-slate-800/60 text-slate-500">
        <FileText className="w-10 h-10 mx-auto mb-3 text-slate-600 opacity-50" />
        <p className="text-base font-semibold text-slate-400">No posts published yet</p>
        <p className="text-xs text-slate-500 mt-1">Posts and rich media feeds will be created in Phase 3 & 4.</p>
      </div>
    </div>
  );
}
