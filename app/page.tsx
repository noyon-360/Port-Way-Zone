"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Video,
  Rocket,
  BookOpen,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user, logout } = useAuth();

  const features = [
    {
      title: "The Vault",
      description:
        "Secure AES-256 encrypted storage for Client Credentials, API keys, and Store logins.",
      icon: <Shield className="w-6 h-6 text-primary-500" />,
    },
    {
      title: "Bridge Call",
      description:
        "Integrated WebRTC/LiveKit module for seamless high-quality meetings with the team.",
      icon: <Video className="w-6 h-6 text-primary-500" />,
    },
    {
      title: "Launchpad",
      description:
        "The ultimate deployment dashboard with real-time VPS, AWS, and App Store status.",
      icon: <Rocket className="w-6 h-6 text-primary-500" />,
    },
    {
      title: "DocuCenter",
      description:
        "Project-specific Notion-style documentation and wikis tailored to your workflows.",
      icon: <BookOpen className="w-6 h-6 text-primary-500" />,
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col bg-background">
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 lg:px-12 border-b border-white/5 glass">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-accent flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-wide">Portway</span>
        </div>

        {user ? (
          <div className="flex items-center gap-4">
            <div className="relative group">
              <button className="px-5 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10 text-sm font-medium focus:outline-none">
                {user.name || "Profile"}
              </button>

              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] shadow-xl overflow-hidden z-50 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200">
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
            <Link href="/dashboard">
              <button className="px-5 py-2 rounded-full bg-primary-600 hover:bg-primary-500 transition-colors text-white text-sm font-medium shadow-lg shadow-primary-600/20 hidden sm:block">
                Dashboard
              </button>
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link href="/login">
              <button className="px-5 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10 text-sm font-medium">
                Sign In
              </button>
            </Link>
            <button className="px-5 py-2 rounded-full bg-primary-600 hover:bg-primary-500 transition-colors text-white text-sm font-medium shadow-lg shadow-primary-600/20 hidden sm:block">
              Get Started
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 mt-12 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary-500/30 bg-primary-500/10 text-primary-300 text-xs font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
            </span>
            Portway OS is now in beta
          </div>

          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            The Unified Client <br className="hidden md:block" />
            <span className="text-gradient">Onboarding & DevOps</span>{" "}
            <br className="hidden md:block" />
            Orchestrator
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Bridge the gap between Account Management and Technical Execution.
            Collect keys securely, manage deployments swiftly, and communicate
            clearly — all from a single hub.
          </p>

          <div className="flex items-center justify-center gap-4 flex-col sm:flex-row">
            <Link href="/login" className="w-full sm:w-auto">
              <button className="w-full px-8 py-4 rounded-full bg-primary-600 hover:bg-primary-500 transition-all text-white font-medium flex items-center justify-center gap-2 shadow-lg shadow-primary-600/25 group">
                Access Dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 rounded-full glass hover:bg-white/10 transition-all text-white font-medium border border-white/10 flex items-center justify-center gap-2">
              Documentation
            </button>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl mx-auto mt-24"
        >
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="glass-card p-6 rounded-2xl transition-all hover:-translate-y-2 duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-background/80 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                {feature.description}
              </p>
              <div className="flex items-center text-xs font-medium text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                Explore Module <ChevronRight className="w-3 h-3 ml-1" />
              </div>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
