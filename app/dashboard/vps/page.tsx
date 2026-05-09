"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Server,
  Activity,
  Plus,
  Globe,
  Cpu,
  MemoryStick as Memory,
  HardDrive,
  Terminal as TerminalIcon,
} from "lucide-react";

interface VPS {
  id?: number;
  project_name: string;
  ip: string;
  ssh_user: string;
  ssh_pass: string;
  status?: string;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

interface Metrics {
  cpu: string;
  ram: string;
  disk: string;
}

export default function VpsDashboard() {
  const [vpsList, setVpsList] = useState<VPS[]>([]);
  const [selectedVps, setSelectedVps] = useState<VPS | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [command, setCommand] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<Metrics>({ cpu: "0%", ram: "0%", disk: "0%" });
  const [currentPath, setCurrentPath] = useState<string>("~");

  const terminalEndRef = useRef<HTMLDivElement>(null);

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newVps, setNewVps] = useState<VPS>({
    project_name: "",
    ip: "",
    ssh_user: "root",
    ssh_pass: "",
  });

  const scrollToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [terminalOutput]);

  // Helper: Silent Reconnect
  const ensureConnection = useCallback(async (vps: VPS) => {
    try {
      const res = await fetch("http://127.0.0.1:8080/connect?user_id=dev_user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "dev_user",
          project_name: vps.project_name,
          vps_ip: vps.ip,
          ssh_user: vps.ssh_user,
          ssh_pass: vps.ssh_pass
        }),
      });
      return res.ok;
    } catch (err) {
      return false;
    }
  }, []);

  // Fetch VPS list
  useEffect(() => {
    const fetchVps = async () => {
      try {
        const res = await fetch(
          "http://127.0.0.1:8080/vps/list?user_id=dev_user",
        );
        const data = await res.json();
        setVpsList(data || []);
      } catch (err) {
        console.error("Failed to fetch VPS list", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVps();
  }, []);

  // Poll Metrics
  useEffect(() => {
    if (!selectedVps) return;
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8080/metrics?user_id=dev_user`);
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch (err) {}
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, [selectedVps]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    try {
      await fetch("http://127.0.0.1:8080/vps/save?user_id=dev_user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newVps, user_id: "dev_user" }),
      });

      const success = await ensureConnection(newVps);
      
      if (success) {
        setVpsList((prev) => {
          const exists = prev.find(v => v.project_name === newVps.project_name);
          if (exists) return prev;
          return [...prev, { ...newVps, status: "online" }];
        });
        setShowAddModal(false);
        setSelectedVps({ ...newVps, status: "online" });
        setTerminalOutput([`Connected to ${newVps.ip} successfully.`]);
        setCurrentPath("~");
      } else {
        alert("Connection failed. Check your server credentials.");
      }
    } catch (err) {
      alert("Error connecting to server");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRunCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command || !selectedVps) return;

    const currentCmd = command;
    setCommand("");
    setTerminalOutput((prev) => [...prev, `${selectedVps.ssh_user}@${selectedVps.project_name.toLowerCase()}:${currentPath}$ ${currentCmd}`]);

    const execute = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8080/exec?user_id=dev_user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: "dev_user", command: currentCmd }),
        });
        
        const data = await res.json();
        if (data.cwd) setCurrentPath(data.cwd);
        
        if (data.output && data.output.trim() !== "") {
          const lines = data.output.split('\n').filter((l: string) => l.trim() !== "");
          setTerminalOutput((prev) => [...prev, ...lines]);
        } else if (data.error) {
          setTerminalOutput((prev) => [...prev, `Error: ${data.error}`]);
        }
      } catch (err) {
        setTerminalOutput((prev) => [...prev, "Command execution failed."]);
      }
    };

    execute();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 p-6 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-400" /> Servers
            </h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="p-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 rounded-lg transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {vpsList.map((vps, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setSelectedVps(vps);
                  setTerminalOutput([]);
                  setCurrentPath("~");
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedVps?.project_name === vps.project_name
                    ? "bg-indigo-600/10 border-indigo-500/50"
                    : "bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700"
                }`}
              >
                <div className="font-medium">{vps.project_name}</div>
                <div className="text-xs text-zinc-500 mt-1">{vps.ip}</div>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${selectedVps?.project_name === vps.project_name ? "bg-emerald-500" : "bg-zinc-600"}`}></span>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-400">
                    {selectedVps?.project_name === vps.project_name ? "online" : "saved"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-9 space-y-6">
          {selectedVps ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard icon={<Cpu className="w-4 h-4" />} label="CPU Usage" value={metrics.cpu} color="text-blue-400" />
                <StatCard icon={<Memory className="w-4 h-4" />} label="RAM Usage" value={metrics.ram} color="text-purple-400" />
                <StatCard icon={<HardDrive className="w-4 h-4" />} label="Disk Space" value={metrics.disk} color="text-amber-400" />
              </div>

              <div className="bg-[#0f0f11] rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col h-[450px]">
                <div className="px-4 py-3 bg-zinc-900/50 border-b border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <TerminalIcon className="w-4 h-4" />
                    <span>Remote Console &mdash; {selectedVps.ip}</span>
                  </div>
                </div>
                <div className="flex-1 p-4 font-mono text-[11px] overflow-y-auto space-y-1 text-zinc-300 scrollbar-hide">
                  {terminalOutput.map((line, i) => (
                    <div key={i} className={line.includes("$") ? "text-indigo-400 mt-2 first:mt-0" : "opacity-90 whitespace-pre-wrap"}>
                      {line}
                    </div>
                  ))}
                  <div className="flex items-start gap-2 mt-2">
                    <span className="text-emerald-500 font-bold whitespace-nowrap">
                      {selectedVps.ssh_user}@{selectedVps.project_name.toLowerCase()}:{currentPath}$
                    </span>
                    <form onSubmit={handleRunCommand} className="flex-1">
                      <input
                        type="text"
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        className="bg-transparent border-none outline-none w-full text-zinc-200"
                        autoFocus
                      />
                    </form>
                  </div>
                  <div ref={terminalEndRef} />
                </div>
              </div>

              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Globe className="w-5 h-5 text-indigo-400" /> Rapid Deployment
                    </h3>
                  </div>
                  <button className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)]">
                    Start Deployment
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/50">
                    <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest block mb-1">Target Path</label>
                    <div className="text-sm">/var/www/{selectedVps.project_name.toLowerCase().replace(/\s+/g, "-")}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/50">
                    <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest block mb-1">Environment</label>
                    <div className="text-sm">Production (Ubuntu 22.04)</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-zinc-800/50 rounded-3xl bg-zinc-900/10">
              <Activity className="w-12 h-12 text-zinc-600 mb-6" />
              <h3 className="text-xl font-semibold mb-2">No Server Selected</h3>
              <button onClick={() => setShowAddModal(true)} className="mt-6 px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm transition-all">
                Connect New VPS
              </button>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f11] border border-zinc-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Connect New VPS</h2>
            <form onSubmit={handleConnect} className="space-y-4">
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
                <button type="submit" disabled={isConnecting} className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium shadow-[0_0_20px_rgba(79,70,229,0.3)]">
                  {isConnecting ? "Connecting..." : "Connect Server"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800/50 p-4 rounded-2xl flex items-center gap-4">
      <div className={`p-3 rounded-xl bg-zinc-950/50 ${color}`}>{icon}</div>
      <div>
        <div className="text-[11px] uppercase text-zinc-500 font-bold tracking-widest">{label}</div>
        <div className="text-lg font-semibold">{value}</div>
      </div>
    </div>
  );
}
