'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import { PostDTO } from '@social/shared';
import { PostComposer } from '@/components/post-composer';
import { PostCard } from '@/components/post-card';
import {
  Layers,
  Database,
  Cpu,
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2,
  Github,
  Server,
  FolderGit2,
  Sparkles,
  MessageSquare,
  Loader2,
} from 'lucide-react';

interface SystemHealth {
  status: string;
  uptime: number;
  checks?: {
    database: string;
    redis: string;
  };
}

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(true);

  // Feed State
  const [posts, setPosts] = useState<PostDTO[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);

  const fetchFeed = useCallback(async () => {
    setIsLoadingFeed(true);
    try {
      const res = await apiClient.get('/posts', { params: { limit: 20 } });
      setPosts(res.data.data);
    } catch {
      setPosts([]);
    } finally {
      setIsLoadingFeed(false);
    }
  }, []);

  useEffect(() => {
    fetch('http://localhost:5000/health/ready')
      .then((res) => res.json())
      .then((data) => {
        setHealth(data);
        setIsLoadingHealth(false);
      })
      .catch(() => {
        setHealth({ status: 'offline', uptime: 0 });
        setIsLoadingHealth(false);
      });

    fetchFeed();
  }, [fetchFeed]);

  const handlePostCreated = (newPost: PostDTO) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const roadmapPhases = [
    {
      phase: 'Phase 0',
      title: 'Foundation, DevOps & Architecture',
      desc: 'Monorepo setup, Docker containers (PG 16, Redis 7, MinIO), ADRs, Zod domain contracts, and CI pipeline.',
      badge: 'Completed',
    },
    {
      phase: 'Phase 1',
      title: 'Identity, Auth & User Profiles',
      desc: 'Argon2id hashing, Access/Refresh Token rotation (HTTP-only cookies), session revocation, and profile management.',
      badge: 'Completed',
    },
    {
      phase: 'Phase 2',
      title: 'Social Graph & Follow System',
      desc: 'Follow/Unfollow mechanics, Block/Mute lists, and cursor-paginated follower matrices.',
      badge: 'Completed',
    },
    {
      phase: 'Phase 3',
      title: 'Posts, Rich Media & Threads',
      desc: 'Direct-to-S3 presigned media uploads, nested threaded comments, and atomic reactions.',
      badge: 'Completed',
    },
    {
      phase: 'Phase 4',
      title: 'Hybrid Feed & Caching Engine',
      desc: 'Sub-30ms timeline delivery via Fan-out on write + Celebrity Fan-out on read with Redis.',
      badge: 'Next Up',
    },
    {
      phase: 'Phase 5',
      title: 'Real-Time Chat & Live Notifications',
      desc: 'WebSocket clustering with Redis pub/sub, live activity notifications, and 1-on-1 direct messaging.',
      badge: 'Planned',
    },
    {
      phase: 'Phase 6',
      title: 'Full-Text Search & Hardening',
      desc: 'PostgreSQL GIN full-text search, trending topics sliding windows, and security audit.',
      badge: 'Planned',
    },
  ];

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col gap-10">
      {/* Top Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-400">
            <Layers className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              Social Media Platform{' '}
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                Enterprise Edition
              </span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Production-grade, high-concurrency architecture with modular monorepo design.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com/Rajtiwari0202/social_media_platform"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors border border-slate-700"
          >
            <Github className="w-4 h-4" />
            GitHub Repository
          </a>
          <a
            href="http://localhost:5000/health"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors shadow-lg shadow-blue-600/20"
          >
            <Server className="w-4 h-4" />
            API Health Endpoint
          </a>
        </div>
      </header>

      {/* Main Grid: Feed on Left (2 cols), Stats/Roadmap on Right (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Feed & Composer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Post Composer */}
          <PostComposer onPostCreated={handlePostCreated} />

          {/* Feed Title Bar */}
          <div className="flex items-center justify-between pt-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-400" /> Community Feed
            </h2>
            <button
              onClick={fetchFeed}
              disabled={isLoadingFeed}
              className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Refresh
            </button>
          </div>

          {/* Posts Stream */}
          {isLoadingFeed ? (
            <div className="py-16 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400">Loading latest posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="py-16 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
              <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">No posts in feed yet</p>
              <p className="text-xs text-slate-500 mt-1">Be the first to publish a post using the composer above!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((postItem) => (
                <PostCard key={postItem.id} post={postItem} onPostDeleted={handlePostDeleted} />
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: System Status & Roadmap */}
        <div className="space-y-6">
          {/* System Status */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">System Status</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="text-slate-500">API Gateway</div>
                <div className="text-green-400 font-semibold mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Active
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="text-slate-500">PostgreSQL 16</div>
                <div className="text-white font-semibold mt-0.5">Port 5432</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="text-slate-500">Redis 7</div>
                <div className="text-white font-semibold mt-0.5">Port 6379</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="text-slate-500">MinIO / S3</div>
                <div className="text-white font-semibold mt-0.5">Port 9000</div>
              </div>
            </div>
          </div>

          {/* Phased Roadmap Timeline */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Roadmap Milestones
            </div>

            <div className="space-y-2.5">
              {roadmapPhases.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs transition-all ${
                    item.badge === 'Completed'
                      ? 'bg-slate-950/40 border-slate-800/60'
                      : item.badge === 'Next Up'
                      ? 'bg-blue-950/20 border-blue-500/30'
                      : 'bg-slate-950/20 border-slate-800/40 opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-white">{item.phase}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        item.badge === 'Completed'
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : item.badge === 'Next Up'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <div className="text-slate-300 font-medium mt-1">{item.title}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 pt-6 pb-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <div>Enterprise Social Media Platform Architecture &copy; 2026. Distributed under MIT License.</div>
        <div className="flex items-center gap-4">
          <a href="https://github.com/Rajtiwari0202/social_media_platform" className="hover:text-slate-300 transition-colors">
            Repository
          </a>
          <span>•</span>
          <a href="/docs/SYSTEM_DESIGN.md" className="hover:text-slate-300 transition-colors">
            System Design Docs
          </a>
        </div>
      </footer>
    </main>
  );
}
