"use client";

import { motion } from "framer-motion";
import { LayoutDashboard, Users, Server, Shield, LogOut } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-white/5 bg-[#161616] flex flex-col">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold tracking-wide">Portway</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary-600/10 text-primary-500 font-medium">
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <Users className="w-5 h-5" />
            Clients
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <Server className="w-5 h-5" />
            Deployments
          </a>
        </nav>

        <div className="p-4 border-t border-white/5">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors">
            <LogOut className="w-5 h-5" />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to Portway</h1>
          <p className="text-slate-400">Here is an overview of your active deployments and clients.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6 rounded-xl">
            <h3 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wide">Total Clients</h3>
            <p className="text-4xl font-light">12</p>
          </div>
          <div className="glass-card p-6 rounded-xl">
            <h3 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wide">Active Deployments</h3>
            <p className="text-4xl font-light text-primary-500">8</p>
          </div>
          <div className="glass-card p-6 rounded-xl border-t-2 border-t-accent">
            <h3 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wide">System Status</h3>
            <p className="text-2xl font-light text-accent flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-accent animate-pulse"></span>
              All Systems Operational
            </p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl">
          <h3 className="text-lg font-medium mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-900/50 flex items-center justify-center">
                    <Server className="w-4 h-4 text-primary-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Deployment successful for Client X</p>
                    <p className="text-xs text-slate-400">2 hours ago</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium border border-accent/20">
                  Success
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
