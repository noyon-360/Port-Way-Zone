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
  ChevronRight,
  Database,
  ArrowRight,
  History,
  Lock,
  GitCommit,
  GitPullRequest,
  Maximize2,
  Minimize2
} from "lucide-react";
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

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
    <div className="bg-[#0d0d0e] border border-zinc-800/50 p-3.5 rounded-xl flex items-center justify-between group hover:border-zinc-700 transition-all">
      <div className="flex items-center gap-2 text-xs uppercase font-bold text-zinc-500">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-sm font-mono font-bold text-zinc-300">{value}</div>
    </div>
  );
}

function FeatureBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-[#18181a] border border-zinc-800/50 p-6 rounded-2xl flex flex-col items-center gap-2 group hover:border-zinc-700 transition-all">
      <div className="p-3.5 rounded-xl bg-[#0d0d0e] mb-2">{icon}</div>
      <div className="text-xs uppercase font-bold text-zinc-500 tracking-widest">{label}</div>
      <div className="text-2xl font-bold font-mono">{value}</div>
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
  const [isTerminalMaximized, setIsTerminalMaximized] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(350);
  const [isResizingTerminal, setIsResizingTerminal] = useState(false);
  const [isFilesLoading, setIsFilesLoading] = useState(false);
  
  // Deployment Configuration States
  const [projectName, setProjectName] = useState("my-app");
  const [repoUrl, setRepoUrl] = useState("");
  const [deployBranch, setDeployBranch] = useState("main");
  const [projType, setProjType] = useState("node");
  const [deployPort, setDeployPort] = useState("3000");
  const [deployDomain, setDeployDomain] = useState("");
  const [pathSuggestions, setPathSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
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
  const isResizingRef = useRef(false);

  // Terminal Resizing Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const newHeight = window.innerHeight - e.clientY;
      if (newHeight > 100 && newHeight < window.innerHeight - 150) {
        setTerminalHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      setIsResizingTerminal(false);
      document.body.style.cursor = "default";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    if (isResizingTerminal) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizingTerminal]);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    setIsResizingTerminal(true);
    setIsTerminalMaximized(false);
    document.body.style.cursor = "ns-resize";
  };

  const toggleMaximize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTerminalMaximized(!isTerminalMaximized);
    setIsTerminalCollapsed(false);
  };

  // Terminal Tabs State
  const [terminals, setTerminals] = useState<{ id: string; name: string; initialPath?: string }[]>([]);
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(null);

  useEffect(() => {
    if (vps && terminals.length === 0) {
      const id = Math.random().toString(36).substr(2, 9);
      setTerminals([{ id, name: 'Terminal 1' }]);
      setActiveTerminalId(id);
    }
  }, [vps]);

  const addTerminal = (path?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const name = path ? `Term: ${path.split('/').pop() || path}` : `Terminal ${terminals.length + 1}`;
    setTerminals(prev => [...prev, { id, name, initialPath: path }]);
    setActiveTerminalId(id);
    setIsTerminalCollapsed(false);
  };

  const closeTerminal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (terminals.length === 1) return;
    const newTerminals = terminals.filter(t => t.id !== id);
    setTerminals(newTerminals);
    if (activeTerminalId === id) {
      setActiveTerminalId(newTerminals[newTerminals.length - 1].id);
    }
  };

  // Auto-fetch file content when activeFile changes
  useEffect(() => {
    if (!activeFile || isDiffView) return;
    
    const fetchContent = async () => {
      setIsEditorLoading(true);
      try {
        const res = await fetch(`http://127.0.0.1:8080/files/read?user_id=dev_user&path=${activeFile}`);
        if (res.ok) {
          const text = await res.text();
          setEditorContent(text);
        }
      } catch (err) {
        console.error("Failed to fetch file content:", err);
      } finally {
        setIsEditorLoading(false);
      }
    };
    
    fetchContent();
  }, [activeFile, isDiffView]);

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

  // Path Autocompletion Logic
  useEffect(() => {
    if (sidebarView !== 'explorer') return;
    
    const fetchSuggestions = async () => {
      if (!fileMgrPath || fileMgrPath.endsWith("/")) {
        setPathSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      const parts = fileMgrPath.split("/");
      const partial = parts.pop() || "";
      const parent = parts.join("/") || (fileMgrPath.startsWith("/") ? "/" : ".");

      try {
        const res = await fetch(`http://127.0.0.1:8080/files/list?user_id=dev_user&path=${parent}`);
        if (res.ok) {
          const data = await res.json();
          const suggestions = (data.files || data || [])
            .filter((f: any) => f.is_dir && f.name.toLowerCase().startsWith(partial.toLowerCase()) && f.name !== partial)
            .map((f: any) => f.name)
            .slice(0, 5);
          setPathSuggestions(suggestions);
          setShowSuggestions(suggestions.length > 0);
          setSelectedSuggestionIndex(0);
        }
      } catch (err) {
        setPathSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 150);
    return () => clearTimeout(timer);
  }, [fileMgrPath, sidebarView]);

  const handleSelectSuggestion = (suggestion: string) => {
    const parts = fileMgrPath.split("/");
    parts.pop();
    const newPath = [...parts, suggestion].join("/") || "/";
    setFileMgrPath(newPath);
    setShowSuggestions(false);
    fetchFiles(newPath);
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
      // Content fetching is now handled by useEffect[activeFile]
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
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
              {sidebarView === "explorer" ? "Explorer" : sidebarView === "metrics" ? "Health" : sidebarView === "git" ? "Source Control" : sidebarView === "search" ? "Search" : "Deploy"}
            </span>
            {sidebarView === "explorer" && (
               <div className="flex items-center gap-1.5">
                 <button onClick={handleCreateFile} className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400" title="New File"><File className="w-4 h-4" /></button>
                 <button onClick={handleCreateFolder} className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400" title="New Folder"><Folder className="w-4 h-4" /></button>
                 <button onClick={handleUploadClick} className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400" title="Upload"><Upload className="w-4 h-4" /></button>
                 <button onClick={() => fetchFiles(fileMgrPath)} className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400" title="Refresh"><RefreshCw className={`w-4 h-4 ${isFilesLoading ? "animate-spin" : ""}`} /></button>
                 <button onClick={goUp} className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400" title="Go Up"><ArrowLeft className="w-4 h-4" /></button>
               </div>
            )}
            {sidebarView === "git" && (
               <button onClick={() => fetchGitInfo(fileMgrPath)} className="p-1 hover:bg-zinc-800 rounded text-zinc-400" title="Refresh"><RefreshCw className={`w-3 h-3 ${isGitLoading ? "animate-spin" : ""}`} /></button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {sidebarView === "explorer" && (
              <div className="py-2">
                <div className="px-4 py-2 border-b border-zinc-800/50 mb-2 relative">
                   <div className="text-xs uppercase font-bold text-zinc-600 tracking-widest mb-2.5">Current Location</div>
                   <div className="relative">
                     <input 
                      type="text" 
                      value={fileMgrPath}
                      onChange={(e) => { setFileMgrPath(e.target.value); }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (showSuggestions && pathSuggestions.length > 0) {
                            handleSelectSuggestion(pathSuggestions[selectedSuggestionIndex]);
                          } else {
                            fetchFiles(fileMgrPath);
                          }
                          setShowSuggestions(false);
                        } else if (e.key === "ArrowDown" && showSuggestions) {
                          e.preventDefault();
                          setSelectedSuggestionIndex((prev) => (prev + 1) % pathSuggestions.length);
                        } else if (e.key === "ArrowUp" && showSuggestions) {
                          e.preventDefault();
                          setSelectedSuggestionIndex((prev) => (prev - 1 + pathSuggestions.length) % pathSuggestions.length);
                        } else if (e.key === "Escape") {
                          setShowSuggestions(false);
                        }
                      }}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      className="w-full bg-[#0d0d0e] border border-zinc-800 rounded-lg px-3 py-2 text-sm font-mono text-zinc-400 focus:border-indigo-500 outline-none"
                    />
                    {showSuggestions && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#18181a] border border-zinc-800 rounded-lg shadow-2xl z-[100] overflow-hidden">
                        {pathSuggestions.map((s, idx) => (
                          <div 
                            key={s}
                            onClick={() => handleSelectSuggestion(s)}
                            className={`px-3 py-2 text-sm font-mono cursor-pointer flex items-center gap-2 transition-colors ${idx === selectedSuggestionIndex ? "bg-indigo-600 text-white" : "text-zinc-400 hover:bg-zinc-800"}`}
                          >
                            <Folder className={`w-3.5 h-3.5 ${idx === selectedSuggestionIndex ? "opacity-100" : "opacity-50"}`} />
                            <span>{s}/</span>
                          </div>
                        ))}
                      </div>
                    )}
                   </div>
                </div>

                <div className="px-4 py-2 border-b border-zinc-800/50 mb-2">
                   <div className="text-xs uppercase font-bold text-zinc-600 tracking-widest mb-2.5">Quick Access</div>
                   <div className="grid grid-cols-2 gap-2">
                      <button disabled={isFilesLoading} onClick={() => fetchFiles("~")} className="flex items-center gap-1.5 px-2 py-2 hover:bg-zinc-800 disabled:opacity-50 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
                         <Layout className={`w-4 h-4 ${isFilesLoading ? "animate-pulse" : ""}`} /> Home
                      </button>
                      <button disabled={isFilesLoading} onClick={() => fetchFiles("/var/www")} className="flex items-center gap-1.5 px-2 py-2 hover:bg-zinc-800 disabled:opacity-50 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
                         <Globe className={`w-4 h-4 ${isFilesLoading ? "animate-pulse" : ""}`} /> Web Root
                      </button>
                      <button disabled={isFilesLoading} onClick={() => fetchFiles("/etc")} className="flex items-center gap-1.5 px-2 py-2 hover:bg-zinc-800 disabled:opacity-50 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
                         <Plus className={`w-4 h-4 ${isFilesLoading ? "animate-pulse" : ""}`} /> Configs
                      </button>
                      <button disabled={isFilesLoading} onClick={() => fetchFiles("/var/log")} className="flex items-center gap-1.5 px-2 py-2 hover:bg-zinc-800 disabled:opacity-50 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
                         <Search className={`w-4 h-4 ${isFilesLoading ? "animate-pulse" : ""}`} /> Logs
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
                      className="flex items-center gap-3 px-4 py-2.5 text-[15px] hover:bg-zinc-800/50 cursor-pointer group transition-colors relative"
                    >
                      {file.is_dir ? <Folder className="w-5 h-5 text-amber-400/80 fill-amber-400/10" /> : <File className="w-5 h-5 text-zinc-500" />}
                      <span className={`truncate ${activeFile?.endsWith(file.name) ? "text-indigo-400 font-medium" : "text-zinc-400 group-hover:text-zinc-200"}`}>{file.name}</span>
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
                          <div key={i} onClick={() => handleFileClick({ name: file.replace('./', ''), is_dir: false })} className="p-2.5 hover:bg-zinc-800/50 rounded-lg cursor-pointer group border border-transparent hover:border-zinc-800 transition-all">
                             <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-bold text-indigo-400 truncate flex-1">{file}</span>
                                <span className="text-[11px] text-zinc-600 bg-zinc-900 px-1.5 rounded">L{line}</span>
                             </div>
                             <div className="text-xs text-zinc-400 line-clamp-2 font-mono bg-black/20 p-2 rounded">{content.trim()}</div>
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
                              <div className="flex items-center justify-between px-1 mb-1.5">
                                 <span className="text-[11px] uppercase font-bold text-zinc-500 tracking-widest">Staged Changes</span>
                                 <button onClick={() => executeGitCmd("reset")} className="text-[10px] text-zinc-600 hover:text-zinc-400 font-bold uppercase">Unstage All</button>
                              </div>
                              {gitStatus.split('\n').filter(l => l[0] !== ' ' && l[0] !== '?').map((line, i) => {
                                 const status = line[0];
                                 const file = line.substring(3);
                                 return (
                                   <div key={i} onClick={() => fetchGitDiff(file, true)} className="flex items-center gap-3 px-2 py-2 hover:bg-zinc-800/50 rounded-lg cursor-pointer group">
                                      <span className={`text-xs font-bold w-5 text-center ${status === 'M' ? "text-amber-500" : status === 'D' ? "text-red-500" : "text-emerald-500"}`}>{status}</span>
                                      <span className="text-sm text-zinc-400 truncate flex-1">{file}</span>
                                      <button onClick={(e) => { e.stopPropagation(); executeGitCmd(`reset "${file}"`); }} className="hidden group-hover:block p-1 hover:bg-zinc-700 rounded text-zinc-400">
                                         <Minus className="w-3.5 h-3.5" />
                                      </button>
                                   </div>
                                 );
                              })}
                           </div>
                         )}

                         {/* Unstaged Changes */}
                         <div className="space-y-1">
                            <div className="flex items-center justify-between px-1 mb-1.5">
                               <span className="text-[11px] uppercase font-bold text-zinc-500 tracking-widest">Changes</span>
                               <div className="flex gap-3">
                                  <button onClick={() => executeGitCmd("checkout .")} className="text-[10px] text-zinc-600 hover:text-red-400 font-bold uppercase">Discard</button>
                                  <button onClick={() => executeGitCmd("add .")} className="text-[10px] text-zinc-600 hover:text-emerald-400 font-bold uppercase">Stage All</button>
                               </div>
                            </div>
                            {gitStatus ? gitStatus.split('\n').filter(l => l[1] !== ' ' || l[0] === '?').map((line, i) => {
                               const status = line[0] === '?' ? 'U' : line[1].trim() || 'M';
                               const file = line.substring(3);
                               return (
                                 <div key={i} onClick={() => fetchGitDiff(file, false)} className="flex items-center gap-3 px-2 py-2 hover:bg-zinc-800/50 rounded-lg cursor-pointer group">
                                    <span className={`text-xs font-bold w-5 text-center ${status === 'M' ? "text-amber-500" : status === 'D' ? "text-red-500" : status === 'U' ? "text-emerald-500" : "text-zinc-500"}`}>{status}</span>
                                    <span className="text-sm text-zinc-400 truncate flex-1">{file}</span>
                                    <button onClick={(e) => { e.stopPropagation(); executeGitCmd(`add "${file}"`); }} className="hidden group-hover:block p-1 hover:bg-zinc-700 rounded text-zinc-400">
                                       <Plus className="w-3.5 h-3.5" />
                                    </button>
                                 </div>
                               );
                            }) : <div className="text-xs text-zinc-600 px-1 italic">No changes</div>}
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
          <div className="h-10 bg-[#18181a] flex items-center overflow-x-auto border-b border-zinc-800/50 scrollbar-hide">
            {openFiles.map((path) => (
              <div key={path} onClick={() => setActiveFile(path)} className={`h-full px-4 flex items-center gap-2.5 text-sm border-r border-zinc-800/50 cursor-pointer transition-all min-w-[140px] ${activeFile === path ? "bg-[#0d0d0e] text-zinc-100 border-t-2 border-t-indigo-500" : "text-zinc-500 hover:bg-zinc-800/30"}`}>
                <File className="w-4 h-4 opacity-70" />
                <span className="truncate flex-1 font-medium">{path.split('/').pop()}</span>
                <button onClick={(e) => { e.stopPropagation(); closeFile(path); }} className="p-1 hover:bg-zinc-700 rounded transition-colors"><XCircle className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-hidden flex flex-col relative">
            {isDiffView ? (
              <div className="flex-1 flex flex-col bg-[#0d0d0e]">
                 <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/30">
                   <div className="flex items-center gap-2.5">
                      <GitBranch className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-mono text-zinc-500">Diff: {diffFile}</span>
                   </div>
                   <button onClick={() => setIsDiffView(false)} className="text-xs text-zinc-500 hover:text-white uppercase font-bold tracking-wider">Close Diff</button>
                 </div>
                 <div className="flex-1 overflow-y-auto font-mono text-sm p-5 bg-[#0a0a0b] leading-relaxed">
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
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/30">
                  <span className="text-sm font-mono text-zinc-500">{activeFile}</span>
                  <button onClick={handleSaveFile} disabled={isSaving} className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/20 rounded-lg text-sm font-bold transition-all">
                    {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                  </button>
                </div>
                <div className="flex-1 relative">
                  {isEditorLoading && <div className="absolute inset-0 bg-[#0d0d0e]/50 backdrop-blur-sm z-10 flex items-center justify-center"><RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" /></div>}
                  <textarea value={editorContent} onChange={(e) => setEditorContent(e.target.value)} className="w-full h-full bg-transparent p-6 font-mono text-base text-zinc-300 outline-none resize-none leading-relaxed" spellCheck={false} />
                </div>
              </div>
            ) : sidebarView === "deploy" ? (
              <div className="flex-1 p-8 overflow-y-auto animate-in slide-in-from-right-4 duration-300">
                <div className="max-w-3xl mx-auto space-y-8 pb-12">
                   <div className="bg-[#18181a] border border-zinc-800/50 rounded-3xl p-8 shadow-2xl">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h2 className="text-3xl font-bold flex items-center gap-3">
                            <Rocket className="w-8 h-8 text-indigo-500" /> Cloud Deployment
                          </h2>
                          <p className="text-zinc-500 text-sm mt-1.5">Configure and launch your application to the VPS</p>
                        </div>
                        <div className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest border ${deployStatus.includes('Success') ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : deployStatus.includes('Failed') ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"}`}>
                           {deployStatus}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-6">
                           <div>
                              <label className="text-xs uppercase text-zinc-500 font-bold tracking-widest block mb-2.5">Project Name</label>
                              <input value={projectName} onChange={(e) => setProjectName(e.target.value)} type="text" placeholder="e.g. my-awesome-app" className="w-full bg-[#0d0d0e] border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all" />
                           </div>
                           <div>
                              <label className="text-xs uppercase text-zinc-500 font-bold tracking-widest block mb-2.5">Repository URL</label>
                              <div className="relative">
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                <input value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} type="text" placeholder="https://github.com/user/repo" className="w-full bg-[#0d0d0e] border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all" />
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-xs uppercase text-zinc-500 font-bold tracking-widest block mb-2.5">Branch</label>
                                <input value={deployBranch} onChange={(e) => setDeployBranch(e.target.value)} type="text" placeholder="main" className="w-full bg-[#0d0d0e] border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all" />
                              </div>
                              <div>
                                <label className="text-xs uppercase text-zinc-500 font-bold tracking-widest block mb-2.5">Port</label>
                                <input value={deployPort} onChange={(e) => setDeployPort(e.target.value)} type="text" placeholder="3000" className="w-full bg-[#0d0d0e] border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all" />
                              </div>
                           </div>
                        </div>

                        <div className="space-y-6">
                           <div>
                              <label className="text-xs uppercase text-zinc-500 font-bold tracking-widest block mb-2.5">Application Category</label>
                              <div className="grid grid-cols-2 gap-2">
                                 {['node', 'go', 'python', 'static'].map((type) => (
                                   <button 
                                     key={type}
                                     onClick={() => setProjType(type)}
                                     className={`py-3 rounded-xl border text-xs font-bold uppercase transition-all ${projType === type ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "bg-[#0d0d0e] border-zinc-800 text-zinc-500 hover:border-zinc-700"}`}
                                   >
                                     {type}
                                   </button>
                                 ))}
                              </div>
                           </div>
                           <div>
                              <label className="text-xs uppercase text-zinc-500 font-bold tracking-widest block mb-2.5">Custom Domain</label>
                              <div className="relative">
                                <Layout className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-600" />
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

                   <div className="bg-[#0d0d0e] border border-zinc-800/50 rounded-3xl p-8 font-mono text-xs">
                      <div className="flex items-center justify-between mb-5">
                        <span className="text-zinc-400 font-bold uppercase tracking-widest text-[11px] flex items-center gap-2.5">
                           <div className={`w-2 h-2 rounded-full ${isDeploying ? "bg-indigo-500 animate-pulse" : "bg-zinc-700"}`} />
                           Deployment Pipeline Log
                        </span>
                        <span className="text-zinc-600 text-[11px]">v1.2.0-stable</span>
                      </div>
                      <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-2 leading-relaxed">
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

          <div 
            style={{ height: isTerminalCollapsed ? "36px" : isTerminalMaximized ? "calc(100vh - 48px)" : `${terminalHeight}px` }}
            className={`border-t border-zinc-800 ${isResizingTerminal ? "" : "transition-all duration-300"} bg-[#0d0d0e] flex flex-col relative ${isTerminalMaximized ? "fixed bottom-0 left-0 right-0 z-[500]" : ""}`}
          >
            {/* Resize Handle */}
            {!isTerminalCollapsed && (
              <div 
                onMouseDown={startResizing}
                className="absolute -top-1 left-0 right-0 h-2 cursor-ns-resize z-[100] group"
              >
                <div className="w-full h-0.5 bg-indigo-500/0 group-hover:bg-indigo-500/50 transition-colors" />
              </div>
            )}
            <div className="h-10 px-2 bg-[#18181a] border-b border-zinc-800/50 flex items-center justify-between group select-none">
              <div className="flex items-center gap-1 h-full overflow-x-auto no-scrollbar">
                {terminals.map((term) => (
                  <div 
                    key={term.id}
                    onClick={() => { setActiveTerminalId(term.id); setIsTerminalCollapsed(false); }}
                    className={`flex items-center gap-2.5 px-4 h-full cursor-pointer text-[11px] font-bold uppercase tracking-wider transition-all border-r border-zinc-800/50 min-w-[120px] max-w-[200px] group/tab ${activeTerminalId === term.id ? "bg-[#0a0a0b] text-indigo-400 border-t-2 border-t-indigo-500" : "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300"}`}
                  >
                    <TerminalIcon className={`w-3.5 h-3.5 ${activeTerminalId === term.id ? "text-indigo-400" : "opacity-50"}`} />
                    <span className="truncate flex-1">{term.name}</span>
                    {terminals.length > 1 && (
                      <XCircle 
                        onClick={(e) => closeTerminal(term.id, e)}
                        className="w-3.5 h-3.5 opacity-0 group-hover/tab:opacity-50 hover:!opacity-100 hover:text-red-400 transition-all" 
                      />
                    )}
                  </div>
                ))}
                <button 
                  onClick={() => addTerminal()}
                  className="p-2 text-zinc-500 hover:text-indigo-400 transition-colors ml-1"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-1 px-2">
                <button 
                  onClick={toggleMaximize}
                  className="p-1.5 text-zinc-500 hover:text-indigo-400 hover:bg-zinc-800/50 rounded-md transition-all"
                  title={isTerminalMaximized ? "Restore" : "Maximize"}
                >
                  {isTerminalMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                <div className="w-[1px] h-4 bg-zinc-800 mx-1" />
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsTerminalCollapsed(!isTerminalCollapsed)}>
                  <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mr-1">{isTerminalCollapsed ? "Expand" : "Collapse"}</div>
                  {isTerminalCollapsed ? <ChevronRight className="w-4 h-4 text-zinc-600 -rotate-90" /> : <ChevronRight className="w-4 h-4 text-zinc-600 rotate-90" />}
                </div>
              </div>
            </div>
            {!isTerminalCollapsed && vps && (
               <div className="flex-1 bg-[#0a0a0b] overflow-hidden relative">
                 {terminals.map((term) => (
                   <div 
                     key={term.id} 
                     className={`absolute inset-0 transition-opacity duration-200 ${activeTerminalId === term.id ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}
                   >
                     <TerminalComponent vps={vps} initialPath={term.initialPath} active={activeTerminalId === term.id} />
                   </div>
                 ))}
               </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="h-7 bg-[#0e0e14] border-t border-indigo-900/40 flex items-center px-4 justify-between text-xs text-indigo-300/70 font-medium">
        <div className="flex items-center gap-5">
           <div className="flex items-center gap-2 hover:bg-indigo-500/10 hover:text-indigo-200 px-2.5 h-full cursor-pointer transition-colors">
              <Globe className="w-3.5 h-3.5" />
              <span className="font-semibold text-indigo-200/80">{vps.project_name}</span>
              <span className="text-indigo-900/60">·</span>
              <span>{vps.ip}</span>
           </div>
           {gitBranch && (
             <div onClick={() => setShowBranchSelector(!showBranchSelector)} className={`flex items-center gap-2 px-2.5 h-full cursor-pointer transition-colors ${showBranchSelector ? "bg-indigo-500/20 text-indigo-200" : "hover:bg-indigo-500/10 hover:text-indigo-200"}`}>
                <GitBranch className="w-3.5 h-3.5" /> <span>{gitBranch}</span>
             </div>
           )}
        </div>
        
        {showBranchSelector && (
          <div className="absolute bottom-9 left-4 w-72 bg-[#18181a] border border-zinc-800 rounded-xl shadow-2xl z-[100] overflow-hidden">
             <div className="px-4 py-2.5 bg-[#0d0d0e] border-b border-zinc-800 text-xs uppercase font-bold text-zinc-500 tracking-widest flex justify-between items-center">
                <span>Switch Branch</span>
                <button onClick={() => setShowBranchSelector(false)}><XCircle className="w-4 h-4" /></button>
             </div>
             <div className="max-h-80 overflow-y-auto py-1.5">
                {gitBranches.map((b) => (
                  <div key={b} onClick={() => handleSwitchBranch(b)} className={`px-4 py-2.5 text-sm flex items-center justify-between cursor-pointer transition-colors ${b === gitBranch ? "bg-indigo-600/20 text-indigo-400" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"}`}>
                     <div className="flex items-center gap-3"><GitBranch className="w-3.5 h-3.5 opacity-50" /> <span>{b}</span></div>
                     {b === gitBranch && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                ))}
             </div>
          </div>
        )}

        <div className="flex items-center gap-5">
           <div className="flex items-center gap-2 px-2.5 h-full">
              <CheckCircle2 className="w-3.5 h-3.5" /> <span>SSH: {vps.ssh_user}</span>
           </div>
           <div className="flex items-center gap-2 px-2.5 h-full">
              <RefreshCw className={`w-3.5 h-3.5 ${isConnecting ? "animate-spin" : ""}`} /> <span>Port: 8080</span>
           </div>
        </div>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
      
      {/* Global Context Menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-[1000]" onClick={() => setContextMenu(null)} />
          <div 
            className="fixed z-[1001] w-56 bg-[#18181a] border border-zinc-800 rounded-xl shadow-2xl py-1.5 animate-in fade-in zoom-in-95 duration-100"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
             <div className="px-4 py-2 border-b border-zinc-800 mb-1.5">
                <div className="text-xs uppercase font-bold text-zinc-600 truncate">{contextMenu.item?.name}</div>
             </div>
             <button onClick={() => { handleRename(contextMenu.item!); setContextMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-zinc-400 hover:bg-indigo-600 hover:text-white flex items-center gap-3 transition-colors">
                <RefreshCw className="w-4 h-4" /> Rename
             </button>
             {contextMenu.item?.is_dir && (
               <button onClick={() => { addTerminal(fileMgrPath === '.' ? contextMenu.item!.name : `${fileMgrPath}/${contextMenu.item!.name}`); setContextMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-zinc-400 hover:bg-indigo-600 hover:text-white flex items-center gap-3 transition-colors">
                  <TerminalIcon className="w-4 h-4" /> Open in Terminal
               </button>
             )}
             <button onClick={() => { handleDownload(contextMenu.item!); setContextMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-zinc-400 hover:bg-indigo-600 hover:text-white flex items-center gap-3 transition-colors">
                <Download className="w-4 h-4" /> Download
             </button>
             <div className="my-1.5 border-t border-zinc-800" />
             <button onClick={() => { handleDeleteFile(contextMenu.item!); setContextMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-600 hover:text-white flex items-center gap-3 transition-colors">
                <Trash className="w-4 h-4" /> Delete
             </button>
          </div>
        </>
      )}
    </div>
  );
}

const TerminalComponent = ({ vps, initialPath, active }: { vps: VPS, initialPath?: string, active: boolean }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (active && fitAddonRef.current) {
      setTimeout(() => {
        fitAddonRef.current?.fit();
        xtermRef.current?.focus();
      }, 50);
    }
  }, [active]);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      theme: {
        background: '#0a0a0b',
        foreground: '#d4d4d8',
        cursor: '#6366f1',
        selectionBackground: 'rgba(99, 102, 241, 0.3)',
      },
      fontSize: 14,
      fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
      allowTransparency: true,
    });
    
    const fitAddon = new FitAddon();
    fitAddonRef.current = fitAddon;
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    
    // Small delay to ensure container is rendered before fitting
    setTimeout(() => {
      fitAddon.fit();
    }, 100);
    
    xtermRef.current = term;
    if (active) term.focus();

    term.writeln('\x1b[1;34m[*] \x1b[1;37mConnecting to Portway SSH Gateway...\x1b[0m');

    const connectTimer = setTimeout(() => {
      const url = new URL(`ws://127.0.0.1:8080/terminal`);
      url.searchParams.set("user_id", "dev_user");
      url.searchParams.set("vps_ip", vps.ip);
      if (initialPath) url.searchParams.set("initial_path", initialPath);

      const ws = new WebSocket(url.toString());
      wsRef.current = ws;

      ws.onopen = () => {
        term.writeln('\x1b[1;34m[*] \x1b[1;32mSession established with ' + vps.ip + '\x1b[0m\r\n');
      };

      ws.onmessage = async (event) => {
        const data = event.data;
        if (data instanceof Blob) {
          const buffer = await data.arrayBuffer();
          term.write(new Uint8Array(buffer));
        } else {
          term.write(data);
        }
      };

      ws.onclose = () => {
        term.writeln('\r\n\x1b[1;31m[!] Connection closed by server.\x1b[0m');
      };

      ws.onerror = () => {
        term.writeln('\r\n\x1b[1;31m[!] WebSocket connection failed.\x1b[0m');
      };

      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });
    }, 500);

    const handleResize = () => {
      fitAddon.fit();
    };
    
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    return () => {
      clearTimeout(connectTimer);
      if (wsRef.current) wsRef.current.close();
      term.dispose();
      resizeObserver.disconnect();
    };
  }, [vps]);

  return <div ref={terminalRef} className="w-full h-full p-2" />;
};
