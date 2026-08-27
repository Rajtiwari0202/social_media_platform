'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Database,
  Cpu,
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2,
  Clock,
  ArrowRight,
  Github,
  Server,
  FolderGit2,
  Sparkles,
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
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(true);

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
  }, []);

  const roadmapPhases = [
    {
      phase: 'Phase 0',
      title: 'Foundation, DevOps & Architecture',
      desc: 'Monorepo setup, Docker containers (PG 16, Redis 7, MinIO), ADRs, Zod domain contracts, and CI pipeline.',
      status: 'active',
      badge: 'Completed',
    },
    {
      phase: 'Phase 1',
      title: 'Identity, Auth & User Profiles',
      desc: 'Argon2id hashing, Access/Refresh Token rotation (HTTP-only cookies), session revocation, and profile management.',
      status: 'pending',
      badge: 'Next Up',
    },
    {
      phase: 'Phase 2',
      title: 'Social Graph & Follow System',
      desc: 'Follow/Unfollow mechanics, Block/Mute lists, and cursor-paginated follower matrices.',
      status: 'pending',
      badge: 'Planned',
    },
    {
      phase: 'Phase 3',
      title: 'Posts, Rich Media & Threads',
      desc: 'Direct-to-S3 presigned media uploads, nested threaded comments, and atomic reactions.',
      status: 'pending',
      badge: 'Planned',
    },
    {
      phase: 'Phase 4',
      title: 'Hybrid Feed & Caching Engine',
      desc: 'Sub-30ms timeline delivery via Fan-out on write + Celebrity Fan-out on read with Redis.',
      status: 'pending',
      badge: 'Planned',
    },
    {
      phase: 'Phase 5',
      title: 'Real-Time Chat & Live Notifications',
      desc: 'WebSocket clustering with Redis pub/sub, live activity notifications, and 1-on-1 direct messaging.',
      status: 'pending',
      badge: 'Planned',
    },
    {
      phase: 'Phase 6',
      title: 'Full-Text Search & Hardening',
      desc: 'PostgreSQL GIN full-text search, trending topics sliding windows, and security audit.',
      status: 'pending',
      badge: 'Planned',
    },
  ];

  return (
    <main className="min-h-screen px-4 py-12 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col gap-12">
      {/* Top Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-800 pb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-400">
            <Layers className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              Social Media Platform <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">Enterprise Edition</span>
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

      {/* System Status Banner */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-green-500/10 rounded-lg text-green-400 border border-green-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Backend Service</div>
            <div className="text-sm font-semibold text-white mt-0.5 flex items-center gap-2">
              {isLoadingHealth ? (
                'Checking...'
              ) : health?.status === 'ready' || health?.status === 'healthy' ? (
                <span className="text-green-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Operational
                </span>
              ) : (
                <span className="text-amber-400">Standby / Starting</span>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">PostgreSQL 16</div>
            <div className="text-sm font-semibold text-white mt-0.5">Port 5432 (ACID Core)</div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-red-500/10 rounded-lg text-red-400 border border-red-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Redis 7 Cache</div>
            <div className="text-sm font-semibold text-white mt-0.5">Port 6379 (Sub-ms Latency)</div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Object Storage</div>
            <div className="text-sm font-semibold text-white mt-0.5">MinIO / S3 (Port 9000)</div>
          </div>
        </div>
      </section>

      {/* Architecture Highlights */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Modular Monorepo</h3>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">
              Decoupled structure with shared domain validation schemas (<code className="text-blue-300">@social/shared</code>), Next.js 15 App Router frontend (<code className="text-blue-300">@social/web</code>), and clean architecture Node.js API (<code className="text-blue-300">@social/api</code>).
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-slate-500 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" /> End-to-end TypeScript Type Safety
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Hybrid Feed Fan-Out</h3>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">
              Sub-30ms timeline delivery. Asynchronous BullMQ workers push updates for standard users, while high-follower accounts use dynamic fan-out on read to prevent write amplification.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-slate-500 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" /> Documented in ADR 0002
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Zero-Compromise Security</h3>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">
              Argon2id password hashing, Access/Refresh Token rotation in HTTP-only cookies, Redis token bucket rate limiting, Helmet headers, and RFC 7807 problem details error responses.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-slate-500 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" /> OWASP Top 10 Hardened
          </div>
        </div>
      </section>

      {/* Phased Roadmap Timeline */}
      <section className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" /> Phased Engineering Roadmap
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Structured corporate sprints with documentation, unit/integration testing, and GitHub release commits.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {roadmapPhases.map((item, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-xl border transition-all ${
                item.status === 'active'
                  ? 'bg-blue-950/20 border-blue-500/30'
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                    {item.phase}
                  </span>
                  <h4 className="text-base font-semibold text-white">{item.title}</h4>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${
                    item.badge === 'Completed'
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                      : item.badge === 'Next Up'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-2 pl-0 sm:pl-16">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

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
