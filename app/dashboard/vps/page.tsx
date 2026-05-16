"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Server,
  Plus,
  Search,
  MoreVertical,
  Settings,
  Trash2,
  ExternalLink,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { api } from "../../../lib/api";
import { ENDPOINTS } from "../../../lib/endpoints";
import { useAuth } from "../../../contexts/AuthContext";

interface VPS {
  id: string;
  project_name: string;
  ip: string;
  ssh_user: string;
  ssh_pass: string;
  status?: string;
}

export default function VpsListPage() {
  const { user } = useAuth();
  const [vpsList, setVpsList] = useState<VPS[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof VPS; direction: "asc" | "desc" } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<VPS | null>(null);
  const [newVps, setNewVps] = useState({ project_name: "", ip: "", ssh_user: "root", ssh_pass: "" });

  const fetchVps = async () => {
    if (!user?._id) return;
    try {
      const { data } = await api.get(`${ENDPOINTS.VPS.LIST}?user_id=${user._id}`);
      setVpsList(data || []);
    } catch (err) {
      console.error("Failed to fetch VPS list", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchVps();
    }
  }, [user]);

  const handleAddVps = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?._id) return;
    try {
      await api.post(ENDPOINTS.VPS.SAVE, { 
        ...newVps, 
        user_id: user._id 
      }, {
        headers: { "X-User-ID": user._id }
      });
      setShowAddModal(false);
      setNewVps({ project_name: "", ip: "", ssh_user: "root", ssh_pass: "" });
      fetchVps();
    } catch (err) {
      alert("Failed to save VPS");
    }
  };

  const handleUpdateVps = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal || !user?._id) return;
    try {
      await api.post(ENDPOINTS.VPS.UPDATE, { 
        ...showEditModal, 
        user_id: user._id 
      }, {
        headers: { "X-User-ID": user._id }
      });
      setShowEditModal(null);
      fetchVps();
    } catch (err) {
      alert("Failed to update VPS");
    }
  };

  const handleDeleteVps = async (id: string) => {
    if (!confirm("Are you sure you want to delete this VPS?") || !user?._id) return;
    try {
      await api.post(ENDPOINTS.VPS.DELETE, { 
        vps_id: id, 
        user_id: user._id 
      }, {
        headers: { "X-User-ID": user._id }
      });
      fetchVps();
    } catch (err) {
      alert("Failed to delete VPS");
    }
  };

  const sortedAndFilteredList = useMemo(() => {
    let list = [...vpsList];
    if (searchQuery) {
      list = list.filter(
        (v) =>
          v.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.ip.includes(searchQuery)
      );
    }
    if (sortConfig) {
      list.sort((a, b) => {
        const aValue = a[sortConfig.key] || "";
        const bValue = b[sortConfig.key] || "";
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [vpsList, searchQuery, sortConfig]);

  const requestSort = (key: keyof VPS) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-indigo-400 mb-6 transition-colors group"
        >
          <div className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center group-hover:bg-indigo-500/10 transition-colors">
            <ChevronUp className="w-3 h-3 -rotate-90" />
          </div>
          <span className="text-sm font-medium">Back to Dashboard</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Server className="w-8 h-8 text-indigo-500" /> VPS Instances
            </h1>
            <p className="text-zinc-500 mt-1">Manage and monitor your virtual private servers</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)]"
          >
            <Plus className="w-5 h-5" /> Add New Server
          </button>
        </div>

        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl overflow-hidden backdrop-blur-md">
          <div className="p-4 border-b border-zinc-800/50 flex flex-col md:flex-row gap-4 justify-between items-center bg-zinc-900/50">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search by name or IP..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-indigo-500 outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span>{sortedAndFilteredList.length} Servers Found</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-900/50 text-[11px] uppercase tracking-wider text-zinc-500 font-bold border-b border-zinc-800/50">
                  <th className="px-6 py-4 cursor-pointer hover:text-zinc-300 transition-colors" onClick={() => requestSort("project_name")}>
                    <div className="flex items-center gap-2">
                      Project Name {sortConfig?.key === "project_name" && (sortConfig.direction === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-zinc-300 transition-colors" onClick={() => requestSort("ip")}>
                    <div className="flex items-center gap-2">
                      IP Address {sortConfig?.key === "ip" && (sortConfig.direction === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {loading ? (
                  <tr key="loading">
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">Loading servers...</td>
                  </tr>
                ) : sortedAndFilteredList.length === 0 ? (
                  <tr key="empty">
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">No servers found.</td>
                  </tr>
                ) : (
                  sortedAndFilteredList.map((vps, idx) => (
                    <tr key={vps.id || (vps as any)._id || idx} className="hover:bg-zinc-800/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-zinc-200">{vps.project_name}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-zinc-400">{vps.ip}</td>
                      <td className="px-6 py-4 text-zinc-400">{vps.ssh_user}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Online
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/dashboard/vps/${vps.id || (vps as any)._id}`}
                            className="p-2 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-all"
                            title="Manage Server"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setShowEditModal(vps)}
                            className="p-2 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-all"
                            title="Edit Configuration"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteVps(vps.id)}
                            className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
                            title="Delete Server"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add VPS Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f11] border border-zinc-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Connect New VPS</h2>
            <form onSubmit={handleAddVps} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest block mb-2">Project Name</label>
                <input type="text" required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none" value={newVps.project_name} onChange={(e) => setNewVps({ ...newVps, project_name: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest block mb-2">IP Address</label>
                <input type="text" required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none" value={newVps.ip} onChange={(e) => setNewVps({ ...newVps, ip: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest block mb-2">SSH User</label>
                  <input type="text" required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none" value={newVps.ssh_user} onChange={(e) => setNewVps({ ...newVps, ssh_user: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest block mb-2">SSH Password</label>
                  <input type="password" required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none" value={newVps.ssh_pass} onChange={(e) => setNewVps({ ...newVps, ssh_pass: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl font-medium">Cancel</button>
                <button type="submit" className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium shadow-[0_0_20px_rgba(79,70,229,0.3)]">Connect</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit VPS Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f11] border border-zinc-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Edit Server Config</h2>
            <form onSubmit={handleUpdateVps} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest block mb-2">Project Name</label>
                <input type="text" required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none" value={showEditModal.project_name} onChange={(e) => setShowEditModal({ ...showEditModal, project_name: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest block mb-2">IP Address</label>
                <input type="text" required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none" value={showEditModal.ip} onChange={(e) => setShowEditModal({ ...showEditModal, ip: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest block mb-2">SSH User</label>
                  <input type="text" required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none" value={showEditModal.ssh_user} onChange={(e) => setShowEditModal({ ...showEditModal, ssh_user: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest block mb-2">SSH Password</label>
                  <input type="password" required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none" value={showEditModal.ssh_pass} onChange={(e) => setShowEditModal({ ...showEditModal, ssh_pass: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setShowEditModal(null)} className="flex-1 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl font-medium">Cancel</button>
                <button type="submit" className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
