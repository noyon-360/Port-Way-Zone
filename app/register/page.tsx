"use client";

import { motion } from "framer-motion";
import { Lock, Mail, ArrowRight, UserPlus, Rocket, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-background">
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-3 z-20 opacity-70 hover:opacity-100 transition-opacity">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-accent flex items-center justify-center">
          <Rocket className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold tracking-wide">Portway</span>
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10 my-12"
      >
        <div className="glass-card rounded-3xl p-8 sm:p-10 relative overflow-hidden">
          {/* Subtle top glow */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-primary-400 to-transparent opacity-50" />
          
          <div className="text-center mb-10">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-6 shadow-inner relative">
              <div className="absolute inset-0 rounded-2xl glow-primary opacity-20"></div>
              <UserPlus className="w-8 h-8 text-primary-400 relative z-10" />
            </div>
            <h2 className="text-3xl font-bold mb-2 tracking-tight">Create Account</h2>
            <p className="text-sm text-slate-400">Join Portway to streamline your DevOps</p>
          </div>

          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold tracking-wide text-slate-300 ml-1 uppercase">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-slate-500" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background/60 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold tracking-wide text-slate-300 ml-1 uppercase">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-slate-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background/60 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold tracking-wide text-slate-300 ml-1 uppercase">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background/60 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-primary-600 hover:bg-primary-500 transition-all text-white font-medium flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20 group mt-8"
            >
              Create Workspace
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-sm text-slate-400">
              Already have an account?{" "}
              <Link href="/login" className="text-white hover:text-primary-400 font-medium transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
