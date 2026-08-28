'use client';

import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import { PostDTO, MediaAttachmentInput } from '@social/shared';
import {
  Image as ImageIcon,
  Smile,
  Send,
  Loader2,
  X,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

interface PostComposerProps {
  onPostCreated?: (newPost: PostDTO) => void;
  placeholder?: string;
  replyToId?: string;
}

export function PostComposer({
  onPostCreated,
  placeholder = "What's happening in tech?",
  replyToId,
}: PostComposerProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [content, setContent] = useState('');
  const [mediaList, setMediaList] = useState<MediaAttachmentInput[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isAuthenticated || !user) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
        <p className="text-slate-300 text-sm mb-3">Sign in to share your thoughts and join the conversation.</p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-all"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all"
          >
            Sign Up
          </Link>
        </div>
      </div>
    );
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (mediaList.length + files.length > 4) {
      setErrorMessage('You can upload a maximum of 4 images per post.');
      return;
    }

    setErrorMessage(null);
    setIsUploadingMedia(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // 1. Get presigned upload URL from API
        const presignRes = await apiClient.post('/media/presigned-url', {
          fileName: file.name,
          fileType: file.type || 'image/jpeg',
          fileSize: file.size,
        });

        const { uploadUrl, publicUrl } = presignRes.data.data;

        // 2. Upload file directly to S3 / MinIO via presigned PUT URL
        await axios.put(uploadUrl, file, {
          headers: {
            'Content-Type': file.type || 'image/jpeg',
          },
        });

        // 3. Append to media list
        setMediaList((prev) => [
          ...prev,
          {
            mediaUrl: publicUrl,
            mediaType: 'IMAGE',
            fileSize: file.size,
            orderIndex: prev.length,
          },
        ]);
      }
    } catch {
      setErrorMessage('Failed to upload one or more files. Please try again.');
    } finally {
      setIsUploadingMedia(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMediaList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && mediaList.length === 0) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const payload = {
        content: content.trim(),
        replyToId,
        media: mediaList.length > 0 ? mediaList : undefined,
      };

      const res = await apiClient.post('/posts', payload);
      const newPost: PostDTO = res.data.data;

      setContent('');
      setMediaList([]);

      if (onPostCreated) {
        onPostCreated(newPost);
      }
    } catch (err: unknown) {
      // @ts-expect-error Axios error handling
      const message = err.response?.data?.detail || 'Failed to publish post. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const maxChars = 2000;
  const charsLeft = maxChars - content.length;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="flex gap-3">
          {/* User Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm uppercase flex-shrink-0 overflow-hidden shadow">
            {user.profile?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.profile.avatarUrl} alt={user.profile.displayName} className="w-full h-full object-cover" />
            ) : (
              user.profile?.displayName ? user.profile.displayName[0] : user.username[0]
            )}
          </div>

          {/* Composer Body */}
          <div className="flex-1">
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={placeholder}
              maxLength={maxChars}
              className="w-full bg-transparent text-white text-sm placeholder-slate-500 outline-none resize-none"
            />

            {/* Media Attachment Previews */}
            {mediaList.length > 0 && (
              <div className={`grid gap-2 my-3 ${mediaList.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {mediaList.map((media, idx) => (
                  <div key={idx} className="relative rounded-xl overflow-hidden group bg-slate-950 max-h-56">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={media.mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(idx)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-red-600 text-white transition-all cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Uploading Media Indicator */}
            {isUploadingMedia && (
              <div className="py-2 text-xs text-blue-400 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Uploading media directly to storage...
              </div>
            )}

            {/* Bottom Controls Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 mt-2">
              <div className="flex items-center gap-1">
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  multiple
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={mediaList.length >= 4 || isUploadingMedia}
                  className="p-2 rounded-xl text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer disabled:opacity-40"
                  title="Attach images (max 4)"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-4">
                {/* Character Counter */}
                <span
                  className={`text-xs ${
                    charsLeft < 100 ? (charsLeft < 20 ? 'text-red-400 font-bold' : 'text-amber-400') : 'text-slate-500'
                  }`}
                >
                  {charsLeft}
                </span>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingMedia || (!content.trim() && mediaList.length === 0)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 active:bg-blue-700 text-white font-semibold text-xs shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Post
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
