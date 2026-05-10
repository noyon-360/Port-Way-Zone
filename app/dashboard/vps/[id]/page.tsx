"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Server,
  Activity,
  Terminal as TerminalIcon,
  FolderTree,
  Rocket,
  ArrowLeft,
  Cpu,
  MemoryStick as Memory,
  HardDrive,
  RefreshCw,
  Folder,
  File,
  Plus,
  Minus,
  Save,
  Play,
  CheckCircle2,
  XCircle,
  GitBranch,
  Cloud,
  Search,
  Globe,
  Layout,
  Download,
  Trash,
  Upload,
} from "lucide-react";

interface VPS {
  id: string;
  project_name: string;
  ip: string;
  ssh_user: string;
  ssh_pass: string;
}

interface Metrics {
  cpu: string;
  ram: string;
  disk: string;
}

interface FileItem {
  name: string;
  size?: number;
  is_dir: boolean;
  mod_time?: string;
}

function ActivityBarIcon({ active, icon, onClick, title }: { active: boolean; icon: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 transition-all relative group ${active ? "text-indigo-500" : "text-zinc-500 hover:text-zinc-300"}`}
    >
      {icon}
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-6 bg-indigo-500 rounded-r" />}
    </button>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-[#0d0d0e] border border-zinc-800/50 p-3 rounded-xl flex items-center justify-between group hover:border-zinc-700 transition-all">
      <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-zinc-500">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-xs font-mono font-bold text-zinc-300">{value}</div>
    </div>
  );
}

function FeatureBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-[#18181a] border border-zinc-800/50 p-6 rounded-2xl flex flex-col items-center gap-2 group hover:border-zinc-700 transition-all">
      <div className="p-3 rounded-xl bg-[#0d0d0e] mb-2">{icon}</div>
      <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">{label}</div>
      <div className="text-xl font-bold font-mono">{value}</div>
    </div>
  );
}

export default function VpsDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [vps, setVps] = useState<VPS | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"health" | "terminal" | "files" | "deploy">("health");
  const [sidebarView, setSidebarView] = useState<"explorer" | "metrics" | "deploy" | "git" | "search">("explorer");
  const [metrics, setMetrics] = useState<Metrics>({ cpu: "0%", ram: "0%", disk: "0%" });
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [command, setCommand] = useState("");
  const [currentPath, setCurrentPath] = useState("~");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [fileMgrPath, setFileMgrPath] = useState(".");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployLog, setDeployLog] = useState<string[]>([]);
  
  // Editor State
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isEditorLoading, setIsEditorLoading] = useState(false);
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(false);
  const [isFilesLoading, setIsFilesLoading] = useState(false);
  
  // Deployment Configuration States
  const [projectName, setProjectName] = useState("my-app");
  const [repoUrl, setRepoUrl] = useState("");
  const [deployBranch, setDeployBranch] = useState("main");
  const [projType, setProjType] = useState("node");
  const [deployPort, setDeployPort] = useState("3000");
  const [deployDomain, setDeployDomain] = useState("");
  const [deployStatus, setDeployStatus] = useState("No active deployment");
  
  // Git State
  const [gitStatus, setGitStatus] = useState<string>("");
  const [gitBranch, setGitBranch] = useState<string>("");
  const [isGitLoading, setIsGitLoading] = useState(false);
  const [commitMessage, setCommitMessage] = useState("");
  const [gitBranches, setGitBranches] = useState<string[]>([]);
  const [isGitActionLoading, setIsGitActionLoading] = useState(false);
  const [showBranchSelector, setShowBranchSelector] = useState(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Diff State
  const [diffContent, setDiffContent] = useState<string>("");
  const [isDiffView, setIsDiffView] = useState(false);
  const [diffFile, setDiffFile] = useState<string>("");

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: FileItem | null } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Fetch VPS details
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8080/vps/list?user_id=dev_user`);
        const data = await res.json();
        const found = data.find((v: any) => v.id === id || v._id === id);
        if (found) {
          setVps(found);
          handleConnect(found);
        } else {
          router.push("/dashboard/vps");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id, router]);

  const handleConnect = async (v: VPS) => {
    setIsConnecting(true);
    try {
      const res = await fetch("http://127.0.0.1:8080/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-ID": "dev_user" },
        body: JSON.stringify({
          user_id: "dev_user",
          project_name: v.project_name,
          vps_ip: v.ip,
          ssh_user: v.ssh_user,
          ssh_pass: v.ssh_pass
        }),
      });
      if (res.ok) {
        setTerminalOutput([`Connected to ${v.ip} successfully.`]);
        fetchMetrics();
        fetchFiles(".");
      }
    } catch (err) {} finally {
      setIsConnecting(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8080/metrics?user_id=dev_user`);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {}
  };

  useEffect(() => {
    if (activeTab === "health" && vps) {
      const interval = setInterval(fetchMetrics, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, vps]);

  const handleRunCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command || !vps) return;
    const currentCmd = command;
    setCommand("");
    setTerminalOutput((prev) => [...prev, `${vps.ssh_user}@${vps.project_name.toLowerCase()}:${currentPath}$ ${currentCmd}`]);

    try {
      const res = await fetch("http://127.0.0.1:8080/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-ID": "dev_user" },
        body: JSON.stringify({ user_id: "dev_user", command: currentCmd }),
      });
      const data = await res.json();
      if (data.cwd) setCurrentPath(data.cwd);
      if (data.output) {
        setTerminalOutput((prev) => [...prev, ...data.output.split('\n')]);
      }
    } catch (err) {
      setTerminalOutput((prev) => [...prev, "Command execution failed."]);
    }
  };

  const fetchFiles = async (path: string) => {
    setIsFilesLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8080/files/list?user_id=dev_user&path=${path}`);
      if (res.ok) {
        const data: FileItem[] = await res.json();
        const sorted = (data || []).sort((a, b) => {
          if (a.is_dir && !b.is_dir) return -1;
          if (!a.is_dir && b.is_dir) return 1;
          return a.name.localeCompare(b.name);
        });
        setFiles(sorted);
        setFileMgrPath(path);
        fetchGitInfo(path);
      }
    } catch (err) {} finally {
      setIsFilesLoading(false);
    }
  };

  const fetchGitInfo = async (path: string) => {
    setIsGitLoading(true);
    try {
      const [statusRes, branchRes, branchesListRes] = await Promise.all([
        fetch(`http://127.0.0.1:8080/git/status?user_id=dev_user&path=${path}`),
        fetch(`http://127.0.0.1:8080/git/branch?user_id=dev_user&path=${path}`),
        fetch(`http://127.0.0.1:8080/git/branches?user_id=dev_user&path=${path}`)
      ]);
      
      if (statusRes.ok) setGitStatus((await statusRes.json()).output);
      if (branchRes.ok) setGitBranch((await branchRes.json()).branch);
      if (branchesListRes.ok) setGitBranches((await branchesListRes.json()).branches || []);
    } catch (err) {} finally {
      setIsGitLoading(false);
    }
  };

  const executeGitCmd = async (gitCmd: string) => {
    setIsGitActionLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8080/git/run", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-ID": "dev_user" },
        body: JSON.stringify({ user_id: "dev_user", path: fileMgrPath, command: gitCmd }),
      });
      const data = await res.json();
      if (data.success) fetchGitInfo(fileMgrPath);
      return data.success;
    } catch (err) { return false; } finally {
      setIsGitActionLoading(false);
    }
  };

  const handleGitCommit = async () => {
    if (!commitMessage) return;
    const success = await executeGitCmd(`commit -m "${commitMessage.replace(/"/g, '\\"')}"`);
    if (success) setCommitMessage("");
  };

  const handleGitSync = async () => {
    await executeGitCmd("pull");
    await executeGitCmd("push");
  };

  const fetchGitDiff = async (file: string, staged: boolean) => {
    setIsEditorLoading(true);
    setIsDiffView(true);
    setDiffFile(file);
    try {
      const res = await fetch(`http://127.0.0.1:8080/git/diff?user_id=dev_user&path=${fileMgrPath}&file=${file}&staged=${staged}`);
      const data = await res.json();
      setDiffContent(data.diff || "No changes detected or binary file.");
    } catch (err) {} finally {
      setIsEditorLoading(false);
    }
  };

  const handleGitInit = async () => {
    await executeGitCmd("init");
  };

  const handleSwitchBranch = async (branchName: string) => {
    const success = await executeGitCmd(`checkout ${branchName}`);
    if (success) setShowBranchSelector(false);
  };

  const handleGlobalSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      const res = await fetch(`http://127.0.0.1:8080/search?user_id=dev_user&path=${fileMgrPath}&query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.output ? data.output.split('\n').filter((l: string) => l.trim()) : []);
    } catch (err) {} finally {
      setIsSearching(false);
    }
  };

  const handleFileClick = async (file: FileItem) => {
    const fullPath = fileMgrPath === "." ? file.name : `${fileMgrPath}/${file.name}`;
    if (file.is_dir) {
      fetchFiles(fullPath);
    } else {
      setIsDiffView(false); // Reset diff view when opening a normal file
      if (!openFiles.includes(fullPath)) setOpenFiles(prev => [...prev, fullPath]);
      setActiveFile(fullPath);
      setIsEditorLoading(true);
      try {
        const res = await fetch(`http://127.0.0.1:8080/files/read?user_id=dev_user&path=${fullPath}`);
        if (res.ok) setEditorContent(await res.text());
      } catch (err) {} finally {
        setIsEditorLoading(false);
      }
    }
  };

  const handleSaveFile = async () => {
    if (!activeFile) return;
    setIsSaving(true);
    try {
      await fetch("http://127.0.0.1:8080/files/write", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-ID": "dev_user" },
        body: JSON.stringify({ user_id: "dev_user", path: activeFile, content: editorContent }),
      });
    } catch (err) {} finally {
      setIsSaving(false);
    }
  };

  const handleCreateFile = async () => {
    const name = prompt("Enter file name:");
    if (!name) return;
    const path = fileMgrPath === "." ? name : `${fileMgrPath}/${name}`;
    try {
      await fetch("http://127.0.0.1:8080/files/write", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-ID": "dev_user" },
        body: JSON.stringify({ user_id: "dev_user", path, content: "" }),
      });
      fetchFiles(fileMgrPath);
    } catch (err) {}
  };

  const handleCreateFolder = async () => {
    const name = prompt("Enter folder name:");
    if (!name) return;
    const path = fileMgrPath === "." ? name : `${fileMgrPath}/${name}`;
    try {
      await fetch("http://127.0.0.1:8080/files/mkdir", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-ID": "dev_user" },
        body: JSON.stringify({ user_id: "dev_user", path }),
      });
      fetchFiles(fileMgrPath);
    } catch (err) {}
  };

  const handleDeleteFile = async (item: FileItem) => {
    if (!confirm(`Are you sure you want to delete ${item.name}?`)) return;
    const path = fileMgrPath === "." ? item.name : `${fileMgrPath}/${item.name}`;
    try {
      await fetch("http://127.0.0.1:8080/files/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-ID": "dev_user" },
        body: JSON.stringify({ user_id: "dev_user", path }),
      });
      fetchFiles(fileMgrPath);
    } catch (err) {}
  };

  const handleRename = async (item: FileItem) => {
    const newName = prompt("Enter new name:", item.name);
    if (!newName || newName === item.name) return;
    const oldPath = fileMgrPath === "." ? item.name : `${fileMgrPath}/${item.name}`;
    const newPath = fileMgrPath === "." ? newName : `${fileMgrPath}/${newName}`;
    try {
      await fetch("http://127.0.0.1:8080/files/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-ID": "dev_user" },
        body: JSON.stringify({ user_id: "dev_user", path: oldPath, new_path: newPath }),
      });
      fetchFiles(fileMgrPath);
    } catch (err) {}
  };

  const handleDownload = async (item: FileItem) => {
    const path = fileMgrPath === "." ? item.name : `${fileMgrPath}/${item.name}`;
    window.open(`http://127.0.0.1:8080/files/read?user_id=dev_user&path=${path}`, '_blank');
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("user_id", "dev_user");
    formData.append("path", fileMgrPath);
    formData.append("file", file);

    try {
      setIsFilesLoading(true);
      const res = await fetch("http://127.0.0.1:8080/files/upload", {
        method: "POST",
        headers: { "X-User-ID": "dev_user" },
        body: formData, 
      });
      if (res.ok) fetchFiles(fileMgrPath);
    } catch (err) {} finally {
      setIsFilesLoading(false);
    }
  };

  const handleDeploy = async () => {
    if (!repoUrl) return alert("Repository URL is required");
    
    setIsDeploying(true);
    setDeployStatus("Starting deployment...");
    
    try {
      await fetch("http://127.0.0.1:8080/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-ID": "dev_user" },
        body: JSON.stringify({
          user_id: "dev_user",
          project_name: projectName,
          repo_url: repoUrl,
          branch: deployBranch,
          type: projType,
          port: deployPort,
          domain: deployDomain,
        }),
      });
      
      const interval = setInterval(async () => {
        try {
          const sRes = await fetch(`http://127.0.0.1:8080/deploy/status?user_id=dev_user`);
          const sData = await sRes.json();
          setDeployStatus(sData.status);
          if (sData.status.includes("Success") || sData.status.includes("Failed")) {
            clearInterval(interval);
            setIsDeploying(false);
          }
        } catch (err) {
          clearInterval(interval);
          setIsDeploying(false);
        }
      }, 2000);
    } catch (err) {
      setDeployStatus("Error initiating deployment");
      setIsDeploying(false);
    }
  };

  const closeFile = (path: string) => {
    const newOpen = openFiles.filter(f => f !== path);
    setOpenFiles(newOpen);
    if (activeFile === path) {
      setActiveFile(newOpen.length > 0 ? newOpen[newOpen.length - 1] : null);
    }
  };

  const goUp = () => {
    if (fileMgrPath === "." || fileMgrPath === "/") return;
    const parts = fileMgrPath.split("/");
    parts.pop();
    fetchFiles(parts.join("/") || ".");
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center text-zinc-500">Loading VPS...</div>;
  if (!vps) return null;

  return (
    <div className="flex h-screen bg-[#0d0d0e] text-zinc-300 font-sans overflow-hidden flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar */}
        <div className="w-12 flex flex-col items-center py-4 bg-[#18181a] border-r border-zinc-800/50 gap-4">
          <ActivityBarIcon active={sidebarView === "explorer"} icon={<FolderTree className="w-5 h-5" />} onClick={() => setSidebarView("explorer")} title="Explorer" />
          <ActivityBarIcon active={sidebarView === "search"} icon={<Search className="w-5 h-5" />} onClick={() => setSidebarView("search")} title="Search" />
          <ActivityBarIcon active={sidebarView === "git"} icon={<GitBranch className="w-5 h-5" />} onClick={() => setSidebarView("git")} title="Source Control" />
          <ActivityBarIcon active={sidebarView === "metrics"} icon={<Activity className="w-5 h-5" />} onClick={() => setSidebarView("metrics")} title="Health" />
          <ActivityBarIcon active={sidebarView === "deploy"} icon={<Rocket className="w-5 h-5" />} onClick={() => setSidebarView("deploy")} title="Deployment" />
          <div className="mt-auto pb-4">
            <button onClick={() => router.push("/dashboard/vps")} className="p-2 text-zinc-500 hover:text-white transition-all"><ArrowLeft className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Side Bar */}
        <div className="w-64 flex flex-col bg-[#18181a] border-r border-zinc-800/50 relative">
          {(isFilesLoading || isGitLoading || isSearching || isGitActionLoading) && (
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-zinc-800 overflow-hidden z-50">
               <div className="h-full bg-indigo-500 animate-pulse w-full"></div>
            </div>
          )}
          
          <div className="p-4 border-b border-zinc-800/50 flex justify-between items-center bg-[#18181a]">
            <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
              {sidebarView === "explorer" ? "Explorer" : sidebarView === "metrics" ? "Health" : sidebarView === "git" ? "Source Control" : sidebarView === "search" ? "Search" : "Deploy"}
            </span>
            {sidebarView === "explorer" && (
               <div className="flex items-center gap-1">
                 <button onClick={handleCreateFile} className="p-1 hover:bg-zinc-800 rounded text-zinc-400" title="New File"><File className="w-3 h-3" /></button>
                 <button onClick={handleCreateFolder} className="p-1 hover:bg-zinc-800 rounded text-zinc-400" title="New Folder"><Folder className="w-3 h-3" /></button>
                 <button onClick={handleUploadClick} className="p-1 hover:bg-zinc-800 rounded text-zinc-400" title="Upload"><Upload className="w-3 h-3" /></button>
                 <button onClick={() => fetchFiles(fileMgrPath)} className="p-1 hover:bg-zinc-800 rounded text-zinc-400" title="Refresh"><RefreshCw className={`w-3 h-3 ${isFilesLoading ? "animate-spin" : ""}`} /></button>
                 <button onClick={goUp} className="p-1 hover:bg-zinc-800 rounded text-zinc-400" title="Go Up"><ArrowLeft className="w-3 h-3" /></button>
               </div>
            )}
            {sidebarView === "git" && (
               <button onClick={() => fetchGitInfo(fileMgrPath)} className="p-1 hover:bg-zinc-800 rounded text-zinc-400" title="Refresh"><RefreshCw className={`w-3 h-3 ${isGitLoading ? "animate-spin" : ""}`} /></button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {sidebarView === "explorer" && (
              <div className="py-2">
                <div className="px-4 py-2 border-b border-zinc-800/50 mb-2">
                   <div className="text-[9px] uppercase font-bold text-zinc-600 tracking-widest mb-2">Current Location</div>
                   <input 
                    type="text" 
                    value={fileMgrPath}
                    onChange={(e) => setFileMgrPath(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchFiles(fileMgrPath)}
                    className="w-full bg-[#0d0d0e] border border-zinc-800 rounded px-2 py-1 text-[10px] font-mono text-zinc-400 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="px-4 py-2 border-b border-zinc-800/50 mb-2">
                   <div className="text-[9px] uppercase font-bold text-zinc-600 tracking-widest mb-2">Quick Access</div>
                   <div className="grid grid-cols-2 gap-1">
                      <button disabled={isFilesLoading} onClick={() => fetchFiles("~")} className="flex items-center gap-1.5 px-2 py-1 hover:bg-zinc-800 disabled:opacity-50 rounded text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors">
                         <Layout className={`w-3 h-3 ${isFilesLoading ? "animate-pulse" : ""}`} /> Home
                      </button>
                      <button disabled={isFilesLoading} onClick={() => fetchFiles("/var/www")} className="flex items-center gap-1.5 px-2 py-1 hover:bg-zinc-800 disabled:opacity-50 rounded text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors">
                         <Globe className={`w-3 h-3 ${isFilesLoading ? "animate-pulse" : ""}`} /> Web Root
                      </button>
                      <button disabled={isFilesLoading} onClick={() => fetchFiles("/etc")} className="flex items-center gap-1.5 px-2 py-1 hover:bg-zinc-800 disabled:opacity-50 rounded text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors">
                         <Plus className={`w-3 h-3 ${isFilesLoading ? "animate-pulse" : ""}`} /> Configs
                      </button>
                      <button disabled={isFilesLoading} onClick={() => fetchFiles("/var/log")} className="flex items-center gap-1.5 px-2 py-1 hover:bg-zinc-800 disabled:opacity-50 rounded text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors">
                         <Search className={`w-3 h-3 ${isFilesLoading ? "animate-pulse" : ""}`} /> Logs
                      </button>
                   </div>
                </div>

                <div className="space-y-[1px]">
                  {files.map((file, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => handleFileClick(file)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({ x: e.clientX, y: e.clientY, item: file });
                      }}
                      className="flex items-center gap-2 px-4 py-1 text-[13px] hover:bg-zinc-800/50 cursor-pointer group transition-colors relative"
                    >
                      {file.is_dir ? <Folder className="w-4 h-4 text-amber-400/80 fill-amber-400/10" /> : <File className="w-4 h-4 text-zinc-500" />}
                      <span className={`truncate ${activeFile?.endsWith(file.name) ? "text-indigo-400" : "text-zinc-400 group-hover:text-zinc-200"}`}>{file.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sidebarView === "search" && (
              <div className="p-4 space-y-4">
                 <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleGlobalSearch()}
                        placeholder="Search files..."
                        className="w-full bg-[#0d0d0e] border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-200 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                 </div>
                 <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-200px)]">
                    {isSearching ? <div className="text-center py-8 animate-pulse text-zinc-500">Searching...</div> : 
                      searchResults.map((res, i) => {
                        const parts = res.split(':');
                        const file = parts[0];
                        const line = parts[1];
                        const content = parts.slice(2).join(':');
                        return (
                          <div key={i} onClick={() => handleFileClick({ name: file.replace('./', ''), is_dir: false })} className="p-2 hover:bg-zinc-800/50 rounded-lg cursor-pointer group border border-transparent hover:border-zinc-800 transition-all">
                             <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] font-bold text-indigo-400 truncate flex-1">{file}</span>
                                <span className="text-[10px] text-zinc-600 bg-zinc-900 px-1 rounded">L{line}</span>
                             </div>
                             <div className="text-[11px] text-zinc-400 line-clamp-2 font-mono bg-black/20 p-1.5 rounded">{content.trim()}</div>
                          </div>
                        );
                      })
                    }
                 </div>
              </div>
            )}

            {sidebarView === "git" && (
              <div className="p-4 space-y-6 animate-in fade-in duration-300">
                 {gitBranch ? (
                   <div className="space-y-6">
                      <div className="flex items-center gap-2 px-3 py-2 bg-[#0d0d0e] border border-zinc-800 rounded-lg">
                         <GitBranch className="w-4 h-4 text-indigo-400" />
                         <span className="text-xs font-mono text-zinc-300">{gitBranch}</span>
                      </div>

                      <div className="space-y-4">
                         {/* Staged Changes */}
                         {gitStatus && gitStatus.split('\n').some(l => l[0] !== ' ' && l[0] !== '?') && (
                           <div className="space-y-1">
                              <div className="flex items-center justify-between px-1 mb-1">
                                 <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-widest">Staged Changes</span>
                                 <button onClick={() => executeGitCmd("reset")} className="text-[9px] text-zinc-600 hover:text-zinc-400 font-bold uppercase">Unstage All</button>
                              </div>
                              {gitStatus.split('\n').filter(l => l[0] !== ' ' && l[0] !== '?').map((line, i) => {
                                 const status = line[0];
                                 const file = line.substring(3);
                                 return (
                                   <div key={i} onClick={() => fetchGitDiff(file, true)} className="flex items-center gap-2 px-2 py-1.5 hover:bg-zinc-800/50 rounded cursor-pointer group">
                                      <span className={`text-[10px] font-bold w-4 text-center ${status === 'M' ? "text-amber-500" : status === 'D' ? "text-red-500" : "text-emerald-500"}`}>{status}</span>
                                      <span className="text-[12px] text-zinc-400 truncate flex-1">{file}</span>
                                      <button onClick={(e) => { e.stopPropagation(); executeGitCmd(`reset "${file}"`); }} className="hidden group-hover:block p-1 hover:bg-zinc-700 rounded text-zinc-400">
                                         <Minus className="w-3 h-3" />
                                      </button>
                                   </div>
                                 );
                              })}
                           </div>
                         )}

                         {/* Unstaged Changes */}
                         <div className="space-y-1">
                            <div className="flex items-center justify-between px-1 mb-1">
                               <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-widest">Changes</span>
                               <div className="flex gap-2">
                                  <button onClick={() => executeGitCmd("checkout .")} className="text-[9px] text-zinc-600 hover:text-red-400 font-bold uppercase">Discard</button>
                                  <button onClick={() => executeGitCmd("add .")} className="text-[9px] text-zinc-600 hover:text-emerald-400 font-bold uppercase">Stage All</button>
                               </div>
                            </div>
                            {gitStatus ? gitStatus.split('\n').filter(l => l[1] !== ' ' || l[0] === '?').map((line, i) => {
                               const status = line[0] === '?' ? 'U' : line[1].trim() || 'M';
                               const file = line.substring(3);
                               return (
                                 <div key={i} onClick={() => fetchGitDiff(file, false)} className="flex items-center gap-2 px-2 py-1.5 hover:bg-zinc-800/50 rounded cursor-pointer group">
                                    <span className={`text-[10px] font-bold w-4 text-center ${status === 'M' ? "text-amber-500" : status === 'D' ? "text-red-500" : status === 'U' ? "text-emerald-500" : "text-zinc-500"}`}>{status}</span>
                                    <span className="text-[12px] text-zinc-400 truncate flex-1">{file}</span>
                                    <button onClick={(e) => { e.stopPropagation(); executeGitCmd(`add "${file}"`); }} className="hidden group-hover:block p-1 hover:bg-zinc-700 rounded text-zinc-400">
                                       <Plus className="w-3 h-3" />
                                    </button>
                                 </div>
                               );
                            }) : <div className="text-[11px] text-zinc-600 px-1 italic">No changes</div>}
                         </div>
                      </div>

                      <div className="pt-4 space-y-3 border-t border-zinc-800/50">
                         <textarea value={commitMessage} onChange={(e) => setCommitMessage(e.target.value)} placeholder="Message (Ctrl+Enter to commit)" className="w-full bg-[#0d0d0e] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 h-20 outline-none resize-none focus:border-indigo-500" onKeyDown={(e) => e.ctrlKey && e.key === 'Enter' && handleGitCommit()} />
                         <div className="flex gap-2">
                            <button onClick={handleGitCommit} disabled={!commitMessage || isGitActionLoading} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-indigo-600/10">Commit</button>
                            <button onClick={handleGitSync} disabled={isGitActionLoading} className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-all" title="Sync Changes"><RefreshCw className={`w-3.5 h-3.5 ${isGitActionLoading ? "animate-spin" : ""}`} /></button>
                         </div>
                      </div>
                   </div>
                 ) : (
                   <div className="text-center py-12">
                      <Cloud className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                      <button onClick={handleGitInit} className="px-6 py-2 bg-zinc-800 text-zinc-200 rounded-full text-xs font-bold border border-zinc-700">Init Git</button>
                   </div>
                 )}
              </div>
            )}

            {sidebarView === "metrics" && (
              <div className="p-4 space-y-4">
                 <MiniStat icon={<Cpu className="w-3.5 h-3.5" />} label="CPU" value={metrics.cpu} />
                 <MiniStat icon={<Memory className="w-3.5 h-3.5" />} label="RAM" value={metrics.ram} />
                 <MiniStat icon={<HardDrive className="w-3.5 h-3.5" />} label="Disk" value={metrics.disk} />
              </div>
            )}
          </div>
        </div>

        {/* Main Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="h-9 bg-[#18181a] flex items-center overflow-x-auto border-b border-zinc-800/50 scrollbar-hide">
            {openFiles.map((path) => (
              <div key={path} onClick={() => setActiveFile(path)} className={`h-full px-3 flex items-center gap-2 text-[12px] border-r border-zinc-800/50 cursor-pointer transition-all min-w-[120px] ${activeFile === path ? "bg-[#0d0d0e] text-zinc-100 border-t-2 border-t-indigo-500" : "text-zinc-500 hover:bg-zinc-800/30"}`}>
                <File className="w-3.5 h-3.5 opacity-70" />
                <span className="truncate flex-1">{path.split('/').pop()}</span>
                <button onClick={(e) => { e.stopPropagation(); closeFile(path); }} className="p-0.5 hover:bg-zinc-700 rounded"><XCircle className="w-3 h-3" /></button>
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-hidden flex flex-col relative">
            {isDiffView ? (
              <div className="flex-1 flex flex-col bg-[#0d0d0e]">
                 <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/30">
                   <div className="flex items-center gap-2">
                      <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-[10px] font-mono text-zinc-500">Diff: {diffFile}</span>
                   </div>
                   <button onClick={() => setIsDiffView(false)} className="text-[10px] text-zinc-500 hover:text-white uppercase font-bold">Close Diff</button>
                 </div>
                 <div className="flex-1 overflow-y-auto font-mono text-[12px] p-4 bg-[#0a0a0b]">
                    {diffContent.split('\n').map((line, i) => {
                      const isAdded = line.startsWith('+') && !line.startsWith('+++');
                      const isRemoved = line.startsWith('-') && !line.startsWith('---');
                      const isHeader = line.startsWith('@@') || line.startsWith('diff --git');
                      
                      return (
                        <div key={i} className={`whitespace-pre-wrap py-0.5 px-2 rounded-sm ${isAdded ? "bg-emerald-900/30 text-emerald-400 border-l-2 border-emerald-500" : isRemoved ? "bg-red-900/30 text-red-400 border-l-2 border-red-500" : isHeader ? "text-indigo-400 font-bold bg-indigo-900/10 my-1" : "text-zinc-500"}`}>
                          {line}
                        </div>
                      );
                    })}
                 </div>
              </div>
            ) : activeFile ? (
              <div className="flex-1 flex flex-col bg-[#0d0d0e]">
                <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/30">
                  <span className="text-[10px] font-mono text-zinc-500">{activeFile}</span>
                  <button onClick={handleSaveFile} disabled={isSaving} className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/20 rounded text-[10px] font-bold">
                    {isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                  </button>
                </div>
                <div className="flex-1 relative">
                  {isEditorLoading && <div className="absolute inset-0 bg-[#0d0d0e]/50 backdrop-blur-sm z-10 flex items-center justify-center"><RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" /></div>}
                  <textarea value={editorContent} onChange={(e) => setEditorContent(e.target.value)} className="w-full h-full bg-transparent p-4 font-mono text-[13px] text-zinc-300 outline-none resize-none leading-relaxed" spellCheck={false} />
                </div>
              </div>
            ) : sidebarView === "deploy" ? (
              <div className="flex-1 p-8 overflow-y-auto animate-in slide-in-from-right-4 duration-300">
                <div className="max-w-3xl mx-auto space-y-8 pb-12">
                   <div className="bg-[#18181a] border border-zinc-800/50 rounded-3xl p-8 shadow-2xl">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Rocket className="w-7 h-7 text-indigo-500" /> Cloud Deployment
                          </h2>
                          <p className="text-zinc-500 text-xs mt-1">Configure and launch your application to the VPS</p>
                        </div>
                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${deployStatus.includes('Success') ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : deployStatus.includes('Failed') ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"}`}>
                           {deployStatus}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-6">
                           <div>
                              <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest block mb-2.5">Project Name</label>
                              <input value={projectName} onChange={(e) => setProjectName(e.target.value)} type="text" placeholder="e.g. my-awesome-app" className="w-full bg-[#0d0d0e] border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all" />
                           </div>
                           <div>
                              <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest block mb-2.5">Repository URL</label>
                              <div className="relative">
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                <input value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} type="text" placeholder="https://github.com/user/repo" className="w-full bg-[#0d0d0e] border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all" />
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest block mb-2.5">Branch</label>
                                <input value={deployBranch} onChange={(e) => setDeployBranch(e.target.value)} type="text" placeholder="main" className="w-full bg-[#0d0d0e] border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all" />
                              </div>
                              <div>
                                <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest block mb-2.5">Port</label>
                                <input value={deployPort} onChange={(e) => setDeployPort(e.target.value)} type="text" placeholder="3000" className="w-full bg-[#0d0d0e] border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all" />
                              </div>
                           </div>
                        </div>

                        <div className="space-y-6">
                           <div>
                              <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest block mb-2.5">Application Category</label>
                              <div className="grid grid-cols-2 gap-2">
                                 {['node', 'go', 'python', 'static'].map((type) => (
                                   <button 
                                     key={type}
                                     onClick={() => setProjType(type)}
                                     className={`py-2.5 rounded-xl border text-[11px] font-bold uppercase transition-all ${projType === type ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "bg-[#0d0d0e] border-zinc-800 text-zinc-500 hover:border-zinc-700"}`}
                                   >
                                     {type}
                                   </button>
                                 ))}
                              </div>
                           </div>
                           <div>
                              <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest block mb-2.5">Custom Domain</label>
                              <div className="relative">
                                <Layout className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                <input value={deployDomain} onChange={(e) => setDeployDomain(e.target.value)} type="text" placeholder="api.yourdomain.com" className="w-full bg-[#0d0d0e] border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all" />
                              </div>
                           </div>
                           <div className="pt-2">
                             <button 
                               onClick={handleDeploy} 
                               disabled={isDeploying}
                               className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 shadow-xl ${isDeploying ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white hover:scale-[1.02] active:scale-95"}`}
                             >
                               {isDeploying ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                               {isDeploying ? "Deployment in Progress..." : "Launch to Production"}
                             </button>
                           </div>
                        </div>
                      </div>
                   </div>

                   <div className="bg-[#0d0d0e] border border-zinc-800/50 rounded-3xl p-6 font-mono text-[11px]">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-zinc-400 font-bold uppercase tracking-widest text-[9px] flex items-center gap-2">
                           <div className={`w-1.5 h-1.5 rounded-full ${isDeploying ? "bg-indigo-500 animate-pulse" : "bg-zinc-700"}`} />
                           Deployment Pipeline Log
                        </span>
                        <span className="text-zinc-600 text-[10px]">v1.2.0-stable</span>
                      </div>
                      <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                         <div className="text-zinc-600">[SYSTEM] Pipeline initialized...</div>
                         <div className="text-zinc-600">[AUTH] User dev_user verified</div>
                         <div className={`transition-all duration-500 ${deployStatus.includes('Starting') ? "text-indigo-400" : "text-zinc-500"}`}>
                           [WAIT] Requesting resource allocation from VPS...
                         </div>
                         {deployStatus !== "No active deployment" && (
                           <div className="text-indigo-400 animate-pulse">[ACTION] {deployStatus}</div>
                         )}
                         {deployStatus.includes('Success') && vps && (
                           <div className="text-emerald-500 font-bold mt-2">✨ DEPLOYMENT SUCCESSFUL: Application is live at {deployDomain || vps.ip}:{deployPort}</div>
                         )}
                         {deployStatus.includes('Failed') && (
                           <div className="text-red-500 font-bold mt-2">❌ DEPLOYMENT FAILED: Check system logs for details.</div>
                         )}
                      </div>
                   </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in zoom-in-95 duration-500">
                <Server className="w-20 h-20 text-zinc-800 mb-6" />
                <h2 className="text-2xl font-bold text-zinc-400 mb-2">Server Workspace</h2>
                <p className="text-zinc-500 max-w-sm text-sm">Select a file from the explorer to start editing or use the terminal below to manage {vps.project_name}.</p>
              </div>
            )}
          </div>

          <div className={`border-t border-zinc-800 transition-all ${isTerminalCollapsed ? "h-9" : "h-[300px]"} bg-[#0d0d0e] flex flex-col`}>
            <div className="h-9 px-4 bg-[#18181a] border-b border-zinc-800/50 flex items-center justify-between cursor-pointer" onClick={() => setIsTerminalCollapsed(!isTerminalCollapsed)}>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-zinc-100 border-b-2 border-indigo-500 h-9 px-1">
                  <TerminalIcon className="w-3.5 h-3.5" /> Terminal
                </div>
              </div>
            </div>
            {!isTerminalCollapsed && (
              <div className="flex-1 p-4 font-mono text-[12px] overflow-y-auto space-y-1 bg-[#0a0a0b]">
                {terminalOutput.map((line, i) => (
                  <div key={i} className={line.includes("$") ? "text-indigo-400 mt-2 first:mt-0 font-bold" : "text-zinc-400 opacity-90 whitespace-pre-wrap"}>{line}</div>
                ))}
                <div className="flex items-start gap-2 mt-2">
                  <span className="text-emerald-500 font-bold whitespace-nowrap">{vps.ssh_user}@{vps.project_name.toLowerCase()}:{currentPath}$</span>
                  <form onSubmit={handleRunCommand} className="flex-1">
                    <input type="text" value={command} onChange={(e) => setCommand(e.target.value)} className="bg-transparent border-none outline-none w-full text-zinc-200" autoFocus />
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="h-6 bg-indigo-600 flex items-center px-4 justify-between text-[11px] text-white font-medium">
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-1.5 hover:bg-white/10 px-2 h-full cursor-pointer">
              <Globe className="w-3 h-3" /> <span>{vps.ip}</span>
           </div>
           {gitBranch && (
             <div onClick={() => setShowBranchSelector(!showBranchSelector)} className={`flex items-center gap-1.5 px-2 h-full cursor-pointer transition-colors ${showBranchSelector ? "bg-white/20" : "hover:bg-white/10"}`}>
                <GitBranch className="w-3 h-3" /> <span>{gitBranch}</span>
             </div>
           )}
        </div>
        
        {showBranchSelector && (
          <div className="absolute bottom-8 left-4 w-64 bg-[#18181a] border border-zinc-800 rounded-lg shadow-2xl z-[100] overflow-hidden">
             <div className="px-3 py-2 bg-[#0d0d0e] border-b border-zinc-800 text-[10px] uppercase font-bold text-zinc-500 tracking-widest flex justify-between items-center">
                <span>Switch Branch</span>
                <button onClick={() => setShowBranchSelector(false)}><XCircle className="w-3 h-3" /></button>
             </div>
             <div className="max-h-64 overflow-y-auto py-1">
                {gitBranches.map((b) => (
                  <div key={b} onClick={() => handleSwitchBranch(b)} className={`px-3 py-2 text-[12px] flex items-center justify-between cursor-pointer transition-colors ${b === gitBranch ? "bg-indigo-600/20 text-indigo-400" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"}`}>
                     <div className="flex items-center gap-2"><GitBranch className="w-3 h-3 opacity-50" /> <span>{b}</span></div>
                     {b === gitBranch && <CheckCircle2 className="w-3 h-3" />}
                  </div>
                ))}
             </div>
          </div>
        )}

        <div className="flex items-center gap-4">
           <div className="flex items-center gap-1.5 px-2 h-full">
              <CheckCircle2 className="w-3 h-3" /> <span>SSH: {vps.ssh_user}</span>
           </div>
           <div className="flex items-center gap-1.5 px-2 h-full">
              <RefreshCw className={`w-3 h-3 ${isConnecting ? "animate-spin" : ""}`} /> <span>Port: 8080</span>
           </div>
        </div>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
      
      {/* Global Context Menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-[1000]" onClick={() => setContextMenu(null)} />
          <div 
            className="fixed z-[1001] w-48 bg-[#18181a] border border-zinc-800 rounded-lg shadow-2xl py-1 animate-in fade-in zoom-in-95 duration-100"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
             <div className="px-3 py-1.5 border-b border-zinc-800 mb-1">
                <div className="text-[10px] uppercase font-bold text-zinc-600 truncate">{contextMenu.item?.name}</div>
             </div>
             <button onClick={() => { handleRename(contextMenu.item!); setContextMenu(null); }} className="w-full text-left px-3 py-1.5 text-xs text-zinc-400 hover:bg-indigo-600 hover:text-white flex items-center gap-2">
                <RefreshCw className="w-3 h-3" /> Rename
             </button>
             <button onClick={() => { handleDownload(contextMenu.item!); setContextMenu(null); }} className="w-full text-left px-3 py-1.5 text-xs text-zinc-400 hover:bg-indigo-600 hover:text-white flex items-center gap-2">
                <Download className="w-3 h-3" /> Download
             </button>
             <div className="my-1 border-t border-zinc-800" />
             <button onClick={() => { handleDeleteFile(contextMenu.item!); setContextMenu(null); }} className="w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-red-600 hover:text-white flex items-center gap-2">
                <Trash className="w-3 h-3" /> Delete
             </button>
          </div>
        </>
      )}
    </div>
  );
}
