'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { PostDTO } from '@social/shared';
import { PostCard } from '@/components/post-card';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export default function SinglePostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [post, setPost] = useState<PostDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) return;
    setIsLoading(true);
    setError(null);

    apiClient
      .get(`/posts/${postId}`)
      .then((res) => {
        setPost(res.data.data);
      })
      .catch((err) => {
        setError(err.response?.data?.detail || 'Post not found or has been deleted.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [postId]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex p-4 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Post Not Available</h2>
        <p className="text-slate-400 text-sm mb-6">{error || 'This post could not be loaded.'}</p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-600/20"
        >
          Return to Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header back button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-white">Conversation</h1>
      </div>

      <PostCard post={post} onPostDeleted={() => router.push('/')} />
    </div>
  );
}
