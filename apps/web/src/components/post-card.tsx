'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import { PostDTO } from '@social/shared';
import { CommentSection } from './comment-section';
import {
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  Share2,
  BadgeCheck,
  MoreHorizontal,
  Trash2,
  Check,
} from 'lucide-react';

interface PostCardProps {
  post: PostDTO;
  onPostDeleted?: (postId: string) => void;
}

export function PostCard({ post: initialPost, onPostDeleted }: PostCardProps) {
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAuthStore();

  const [post, setPost] = useState<PostDTO>(initialPost);
  const [showComments, setShowComments] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const isAuthor = currentUser && currentUser.id === post.authorId;

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return router.push('/login');

    const previousLiked = post.hasLiked;
    const diff = previousLiked ? -1 : 1;

    // Optimistic toggle
    setPost({
      ...post,
      hasLiked: !previousLiked,
      likesCount: Math.max(0, post.likesCount + diff),
    });

    try {
      const res = await apiClient.post(`/posts/${post.id}/like`);
      const { hasLiked, likesCount } = res.data.data;
      setPost((prev) => ({ ...prev, hasLiked, likesCount }));
    } catch {
      // Rollback
      setPost((prev) => ({
        ...prev,
        hasLiked: previousLiked,
        likesCount: Math.max(0, prev.likesCount - diff),
      }));
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return router.push('/login');

    const previousBookmarked = post.hasBookmarked;
    const diff = previousBookmarked ? -1 : 1;

    setPost({
      ...post,
      hasBookmarked: !previousBookmarked,
      bookmarksCount: Math.max(0, post.bookmarksCount + diff),
    });

    try {
      const res = await apiClient.post(`/posts/${post.id}/bookmark`);
      const { hasBookmarked, bookmarksCount } = res.data.data;
      setPost((prev) => ({ ...prev, hasBookmarked, bookmarksCount }));
    } catch {
      setPost((prev) => ({
        ...prev,
        hasBookmarked: previousBookmarked,
        bookmarksCount: Math.max(0, prev.bookmarksCount - diff),
      }));
    }
  };

  const handleRepost = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return router.push('/login');

    const previousReposted = post.hasReposted;
    const diff = previousReposted ? -1 : 1;

    setPost({
      ...post,
      hasReposted: !previousReposted,
      repostsCount: Math.max(0, post.repostsCount + diff),
    });

    try {
      const res = await apiClient.post(`/posts/${post.id}/repost`);
      const { hasReposted, repostsCount } = res.data.data;
      setPost((prev) => ({ ...prev, hasReposted, repostsCount }));
    } catch {
      setPost((prev) => ({
        ...prev,
        hasReposted: previousReposted,
        repostsCount: Math.max(0, prev.repostsCount - diff),
      }));
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await apiClient.delete(`/posts/${post.id}`);
      if (onPostDeleted) onPostDeleted(post.id);
    } catch {
      alert('Failed to delete post.');
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    const url = `${window.location.origin}/posts/${post.id}`;
    await navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Helper to render content with highlighted hashtags and mentions
  const renderFormattedContent = (text: string) => {
    const parts = text.split(/(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('#')) {
        return (
          <span key={i} className="text-blue-400 font-medium hover:underline cursor-pointer">
            {part}
          </span>
        );
      }
      if (part.startsWith('@')) {
        return (
          <Link
            key={i}
            href={`/${part.slice(1)}`}
            className="text-blue-400 font-medium hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </Link>
        );
      }
      return part;
    });
  };

  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <article className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-lg hover:border-slate-700/80 transition-all">
      {/* Top Author Row */}
      <div className="flex items-start justify-between gap-3">
        <Link href={`/${post.author.username}`} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm uppercase flex-shrink-0 shadow overflow-hidden">
            {post.author.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.author.avatarUrl} alt={post.author.displayName} className="w-full h-full object-cover" />
            ) : (
              post.author.displayName[0]
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                {post.author.displayName}
              </span>
              {post.author.isVerified && (
                <BadgeCheck className="w-4 h-4 text-blue-400 fill-blue-400/20 flex-shrink-0" />
              )}
            </div>
            <div className="text-xs text-slate-400">
              @{post.author.username} • {formattedDate}
            </div>
          </div>
        </Link>

        {/* Options Menu (Delete if author) */}
        {isAuthor && (
          <div className="relative">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showOptions && (
              <div className="absolute right-0 mt-1 w-36 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1 z-50 text-xs">
                <button
                  onClick={handleDeletePost}
                  className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 transition-colors text-left cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Content */}
      <div className="mt-3 text-sm text-slate-200 leading-relaxed break-words">
        {renderFormattedContent(post.content)}
      </div>

      {/* Media Attachments Grid */}
      {post.media && post.media.length > 0 && (
        <div
          className={`grid gap-2 mt-3 rounded-2xl overflow-hidden ${
            post.media.length === 1
              ? 'grid-cols-1 max-h-96'
              : post.media.length === 2
              ? 'grid-cols-2 max-h-72'
              : post.media.length === 3
              ? 'grid-cols-3 max-h-56'
              : 'grid-cols-2 max-h-80'
          }`}
        >
          {post.media.map((mediaItem) => (
            <div key={mediaItem.id} className="relative w-full h-full bg-slate-950 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaItem.mediaUrl}
                alt="Attachment"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      )}

      {/* Bottom Reactions & Action Bar */}
      <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-800/60 text-xs text-slate-400">
        {/* Like Button */}
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg transition-all cursor-pointer ${
            post.hasLiked
              ? 'text-rose-400 bg-rose-500/10'
              : 'hover:text-rose-400 hover:bg-rose-500/10'
          }`}
        >
          <Heart className={`w-4 h-4 ${post.hasLiked ? 'fill-rose-400' : ''}`} />
          <span className="font-semibold">{post.likesCount > 0 ? post.likesCount : ''}</span>
        </button>

        {/* Comment Button */}
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:text-blue-400 hover:bg-blue-500/10 transition-all cursor-pointer"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="font-semibold">{post.commentsCount > 0 ? post.commentsCount : ''}</span>
        </button>

        {/* Repost Button */}
        <button
          onClick={handleRepost}
          className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg transition-all cursor-pointer ${
            post.hasReposted
              ? 'text-emerald-400 bg-emerald-500/10'
              : 'hover:text-emerald-400 hover:bg-emerald-500/10'
          }`}
        >
          <Repeat2 className="w-4 h-4" />
          <span className="font-semibold">{post.repostsCount > 0 ? post.repostsCount : ''}</span>
        </button>

        {/* Bookmark Button */}
        <button
          onClick={handleBookmark}
          className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg transition-all cursor-pointer ${
            post.hasBookmarked
              ? 'text-indigo-400 bg-indigo-500/10'
              : 'hover:text-indigo-400 hover:bg-indigo-500/10'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${post.hasBookmarked ? 'fill-indigo-400' : ''}`} />
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
          title="Copy link to post"
        >
          {copiedLink ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Inline Comments Section */}
      {showComments && (
        <CommentSection
          postId={post.id}
          onCommentCountChange={(diff) =>
            setPost((prev) => ({ ...prev, commentsCount: Math.max(0, prev.commentsCount + diff) }))
          }
        />
      )}
    </article>
  );
}
