'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import { CommentThreadDTO, CommentDTO } from '@social/shared';
import {
  Send,
  Loader2,
  CornerDownRight,
  Heart,
  MessageSquare,
} from 'lucide-react';

interface CommentSectionProps {
  postId: string;
  onCommentCountChange?: (diff: number) => void;
}

export function CommentSection({ postId, onCommentCountChange }: CommentSectionProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [comments, setComments] = useState<CommentThreadDTO[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    apiClient
      .get(`/posts/${postId}/comments`)
      .then((res) => {
        setComments(res.data.data);
      })
      .catch(() => {
        setComments([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [postId]);

  const handleSubmitRootComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await apiClient.post(`/posts/${postId}/comments`, {
        content: newCommentText.trim(),
      });
      const createdComment: CommentDTO = res.data.data;

      setComments((prev) => [...prev, { ...createdComment, replies: [], repliesCount: 0 }]);
      setNewCommentText('');
      if (onCommentCountChange) onCommentCountChange(1);
    } catch {
      alert('Failed to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await apiClient.post(`/posts/${postId}/comments`, {
        content: replyText.trim(),
        parentId,
      });
      const createdReply: CommentDTO = res.data.data;

      setComments((prev) =>
        prev.map((c) => {
          if (c.id === parentId) {
            return {
              ...c,
              replies: [...(c.replies || []), createdReply],
              repliesCount: (c.repliesCount || 0) + 1,
            };
          }
          return c;
        })
      );

      setReplyingToId(null);
      setReplyText('');
      if (onCommentCountChange) onCommentCountChange(1);
    } catch {
      alert('Failed to post reply.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-4">
      {/* Root Comment Input */}
      {isAuthenticated && user ? (
        <form onSubmit={handleSubmitRootComment} className="flex gap-2.5 items-start">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs uppercase flex-shrink-0 overflow-hidden shadow">
            {user.profile?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.profile.avatarUrl} alt={user.profile.displayName} className="w-full h-full object-cover" />
            ) : (
              user.profile?.displayName ? user.profile.displayName[0] : user.username[0]
            )}
          </div>
          <div className="flex-1 relative">
            <input
              type="text"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="w-full pl-3.5 pr-10 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 text-white text-xs placeholder-slate-500 outline-none transition-all"
            />
            <button
              type="submit"
              disabled={isSubmitting || !newCommentText.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-300 disabled:opacity-40 p-1 cursor-pointer transition-all"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-3 text-center text-xs text-slate-400 bg-slate-950/60 rounded-xl">
          <Link href="/login" className="text-blue-400 hover:underline font-semibold">
            Log in
          </Link>{' '}
          to leave a reply.
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="py-6 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <div className="py-4 text-center text-xs text-slate-500">No comments yet. Be the first to comment!</div>
      ) : (
        <div className="space-y-3.5 divide-y divide-slate-800/40">
          {comments.map((comment) => (
            <div key={comment.id} className="pt-3 first:pt-0 space-y-2">
              <div className="flex items-start gap-2.5">
                <Link href={`/${comment.author.username}`} className="flex-shrink-0">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs uppercase shadow overflow-hidden">
                    {comment.author.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={comment.author.avatarUrl} alt={comment.author.displayName} className="w-full h-full object-cover" />
                    ) : (
                      comment.author.displayName[0]
                    )}
                  </div>
                </Link>

                <div className="flex-1 min-w-0 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/${comment.author.username}`}
                      className="text-xs font-semibold text-white hover:text-blue-400 transition-colors truncate"
                    >
                      {comment.author.displayName}{' '}
                      <span className="text-[11px] font-normal text-slate-500">@{comment.author.username}</span>
                    </Link>
                    <span className="text-[10px] text-slate-500">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed break-words">{comment.content}</p>

                  {/* Actions */}
                  {isAuthenticated && (
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                      <button
                        onClick={() =>
                          setReplyingToId(replyingToId === comment.id ? null : comment.id)
                        }
                        className="hover:text-blue-400 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <CornerDownRight className="w-3 h-3" />
                        Reply
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Reply Composer Box */}
              {replyingToId === comment.id && isAuthenticated && (
                <div className="ml-9 flex gap-2 items-center pt-1">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Reply to @${comment.author.username}...`}
                    className="flex-1 pl-3 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 text-white text-xs placeholder-slate-500 outline-none"
                  />
                  <button
                    onClick={() => handleSubmitReply(comment.id)}
                    disabled={isSubmitting || !replyText.trim()}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold disabled:opacity-40 transition-all cursor-pointer"
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => {
                      setReplyingToId(null);
                      setReplyText('');
                    }}
                    className="px-2 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Nested Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-9 space-y-2 pt-1.5 border-l-2 border-slate-800/80 pl-3">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="flex items-start gap-2">
                      <Link href={`/${reply.author.username}`} className="flex-shrink-0">
                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-[10px] uppercase shadow overflow-hidden">
                          {reply.author.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={reply.author.avatarUrl} alt={reply.author.displayName} className="w-full h-full object-cover" />
                          ) : (
                            reply.author.displayName[0]
                          )}
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40">
                        <div className="flex items-center justify-between">
                          <Link
                            href={`/${reply.author.username}`}
                            className="text-xs font-semibold text-white hover:text-blue-400 truncate"
                          >
                            {reply.author.displayName}{' '}
                            <span className="text-[10px] font-normal text-slate-500">@{reply.author.username}</span>
                          </Link>
                          <span className="text-[10px] text-slate-500">
                            {new Date(reply.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5 leading-relaxed break-words">{reply.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
