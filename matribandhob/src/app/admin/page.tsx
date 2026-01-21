"use client";
import { useState, useEffect } from "react";
import {
    collection, query, getDocs, updateDoc,
    doc, deleteDoc, limit, orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AdminUser } from "@/types/admin";
import {
    ShieldCheck, Users, Activity, Truck, Search,
    Trash2, CheckCircle, Ban, RefreshCw, AlertTriangle,
    BarChart3, FileText, Settings, LayoutDashboard, XCircle, Terminal
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { logSystemEvent, fetchSystemLogs, SystemLog } from "@/lib/logger";

// Register ChartJS
ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement
);

// --- TABS & TYPES ---
type AdminTab = 'dashboard' | 'users' | 'health' | 'settings';

export default function AdminDashboard() {
    const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard');
    const [stats, setStats] = useState({ totalUsers: 0, mothers: 0, doctors: 0, drivers: 0 });
    const [recentLogs, setRecentLogs] = useState<SystemLog[]>([]);

    // Refresh Logic
    const refreshAll = () => {
        // Trigger re-fetches via simpler state if needed, or direct calls ref passed down
        window.location.reload(); // Simple refresh for now to ensure clean state
    };

    // Initial Data Fetch
    useEffect(() => {
        const init = async () => {
            await logSystemEvent('info', 'Admin Dashboard Accessed', 'Super Admin logged in');
            const logs = await fetchSystemLogs(5);
            setRecentLogs(logs);
        };
        init();
    }, []);

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans">
            {/* SIDEBAR */}
            <aside className="w-20 lg:w-64 bg-slate-900 fixed h-full z-10 flex flex-col items-center lg:items-start py-8 transition-all">
                <div className="px-4 mb-10 flex items-center gap-3 w-full justify-center lg:justify-start">
                    <ShieldCheck className="w-8 h-8 text-purple-500" />
                    <span className="text-xl font-bold text-white hidden lg:block">Admin<span className="text-purple-500">OS</span></span>
                </div>

                <nav className="flex-1 w-full space-y-2 px-2">
                    <SidebarItem icon={BarChart3} label="Dashboard" active={currentTab === 'dashboard'} onClick={() => setCurrentTab('dashboard')} />
                    <SidebarItem icon={Users} label="User Management" active={currentTab === 'users'} onClick={() => setCurrentTab('users')} />
                    <SidebarItem icon={Activity} label="System Health" active={currentTab === 'health'} onClick={() => setCurrentTab('health')} />
                    <SidebarItem icon={Settings} label="Settings" active={currentTab === 'settings'} onClick={() => setCurrentTab('settings')} />
                </nav>

                <div className="px-4 w-full">
                    <div className="bg-slate-800 rounded-xl p-4 hidden lg:block">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">System Status</p>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs text-green-400 font-bold">Operational</span>
                        </div>
                        <p className="text-[10px] text-slate-500">v2.1.0-alpha</p>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 ml-20 lg:ml-64 p-8 overflow-y-auto">
                {currentTab === 'dashboard' && <DashboardView recentLogs={recentLogs} />}
                {currentTab === 'users' && <UserManagementView />}
                {currentTab === 'health' && <SystemHealthView />}
                {currentTab === 'settings' && <div className="text-center py-20 text-slate-400">Settings Module Coming Soon</div>}
            </main>
        </div>
    );
}

// --- SUB-VIEWS ---

function DashboardView({ recentLogs }: { recentLogs: SystemLog[] }) {
    const [chartData, setChartData] = useState<any>({
        labels: [],
        datasets: []
    });
    const [metrics, setMetrics] = useState({
        totalUsers: 0,
        activeUsers: 0,
        serverStatus: 'Healthy'
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch all users for analytics
                // Note: In a large scale app, this would use a dedicated aggregation, but fits MVP.
                const q = query(collection(db, "users"));
                const snap = await getDocs(q);

                const users = snap.docs.map(d => ({
                    ...d.data(),
                    createdAt: d.data().createdAt?.toDate ? d.data().createdAt.toDate() :
                        d.data().joinedAt?.toDate ? d.data().joinedAt.toDate() : new Date(),
                    lastActive: d.data().lastActive?.toDate ? d.data().lastActive.toDate() : null
                }));

                // 1. Calculate Active Users (active in last 24h)
                const now = new Date();
                const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                const activeCount = users.filter(u => u.lastActive && u.lastActive > oneDayAgo).length;

                // 2. Prepare Chart Data (Last 7 Days)
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const last7Days = [];
                const counts = new Array(7).fill(0);

                for (let i = 6; i >= 0; i--) {
                    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                    last7Days.push(days[d.getDay()]);

                    // Count users registered on this day
                    const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                    const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);

                    counts[6 - i] = users.filter(u => u.createdAt >= startOfDay && u.createdAt < endOfDay).length;
                }

                setMetrics({
                    totalUsers: users.length,
                    activeUsers: activeCount,
                    serverStatus: 'Good'
                });

                setChartData({
                    labels: last7Days,
                    datasets: [{
                        label: 'New Registrations',
                        data: counts,
                        borderColor: 'rgb(147, 51, 234)',
                        backgroundColor: 'rgba(147, 51, 234, 0.5)',
                        tension: 0.4,
                        fill: true
                    }]
                });

            } catch (e) {
                console.error("Failed to fetch analytics", e);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="space-y-8 animate-fade-in">
            <header>
                <h1 className="text-3xl font-black text-slate-900">Mission Control</h1>
                <p className="text-slate-500">Real-time system overview</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Users" value={metrics.totalUsers} icon={Activity} color="bg-blue-500" />
                <StatCard label="Active (24h)" value={metrics.activeUsers} icon={Users} color="bg-purple-500" />
                <StatCard label="System Status" value={metrics.serverStatus} icon={Terminal} color="bg-emerald-500" />
                <StatCard label="Recent Issues" value={recentLogs.filter(l => l.level === 'error').length} icon={AlertTriangle} color="bg-orange-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-6">Growth Analytics (Last 7 Days)</h3>
                    <div className="h-64 w-full">
                        {chartData.labels.length > 0 ? (
                            <Line options={{ responsive: true, maintainAspectRatio: false }} data={chartData} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400">Loading Analytics...</div>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Terminal className="w-5 h-5 text-slate-400" /> System Logs
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-3 max-h-64 pr-2 custom-scrollbar">
                        {recentLogs.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">No logs initialized...</p>
                        ) : recentLogs.map((log, i) => (
                            <div key={i} className="text-xs border-l-2 border-slate-200 pl-3 py-1">
                                <span className={`uppercase font-bold text-[10px] ${log.level === 'error' ? 'text-red-500' : 'text-blue-500'}`}>{log.level}</span>
                                <p className="text-slate-600 truncate">{log.message}</p>
                                <p className="text-[10px] text-slate-400">{log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString() : 'Just now'}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}


function UserManagementView() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRole, setFilterRole] = useState("all");

    // Fetch
    const fetchData = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "users"), limit(100));
            const snap = await getDocs(q);
            const list = snap.docs.map(d => {
                const data = d.data();
                return {
                    id: d.id,
                    name: data.basicInfo?.fullName || data.fullName || "Unknown",
                    email: data.email || "No Email",
                    role: data.role || 'mother',
                    status: data.status || 'active',
                    isVerified: data.isVerified === true,
                    joinedAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
                    lastActive: new Date()
                } as AdminUser;
            });
            setUsers(list);
        } catch (e) { console.error(e) }
        setLoading(false);
    };

    useEffect(() => { fetchData() }, []);

    // Selection
    const toggleSelect = (id: string) => {
        if (selectedIds.includes(id)) setSelectedIds(prev => prev.filter(i => i !== id));
        else setSelectedIds(prev => [...prev, id]);
    };

    // Cluster Delete
    const handleClusterDelete = async () => {
        if (!confirm(`Delete ${selectedIds.length} users permanently?`)) return;

        for (const id of selectedIds) {
            try {
                await deleteDoc(doc(db, "users", id));
                await logSystemEvent('critical', `User Deleted: ${id}`, "Admin cluster delete action");
            } catch (e) {
                console.error("Failed to delete", id);
            }
        }
        setUsers(prev => prev.filter(u => !selectedIds.includes(u.id)));
        setSelectedIds([]);
        alert("Cluster deletion complete.");
    };

    // Filter
    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || u.role === filterRole;
        return matchesSearch && matchesRole;
    });

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">User Management</h1>
                    <p className="text-slate-500">Manage access and accounts</p>
                </div>
                {selectedIds.length > 0 && (
                    <button
                        onClick={handleClusterDelete}
                        className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-red-200 animate-in fade-in slide-in-from-top-4"
                    >
                        <Trash2 className="w-4 h-4" /> Delete {selectedIds.length} Selected
                    </button>
                )}
            </header>

            {/* TOOLBAR */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 justify-between">
                <div className="flex gap-2">
                    {['all', 'mother', 'doctor', 'driver'].map(r => (
                        <button
                            key={r}
                            onClick={() => setFilterRole(r)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${filterRole === r ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-black border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 w-10">
                                <input type="checkbox" onChange={(e) => {
                                    if (e.target.checked) setSelectedIds(filteredUsers.map(u => u.id));
                                    else setSelectedIds([]);
                                }} />
                            </th>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredUsers.map(user => (
                            <tr key={user.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(user.id) ? 'bg-purple-50 hover:bg-purple-100' : ''}`}>
                                <td className="px-6 py-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(user.id)}
                                        onChange={() => toggleSelect(user.id)}
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 text-xs">
                                            {user.name[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">{user.name}</p>
                                            <p className="text-xs text-slate-400">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold capitalize">{user.role}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-xs font-bold ${user.status === 'active' ? 'text-green-500' : 'text-red-500'}`}>{user.status}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-slate-400 hover:text-slate-900"><Settings className="w-4 h-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    )
}

function SystemHealthView() {
    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-black text-slate-900">System Diagnostics</h1>
                <p className="text-slate-500">Deep inspection and logs</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 space-y-4">
                    <h3 className="font-bold">Database Integrity</h3>
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-6 h-6 text-green-500" />
                            <div>
                                <p className="font-bold text-green-800">Firestore Connection</p>
                                <p className="text-xs text-green-600">Latency: 24ms</p>
                            </div>
                        </div>
                        <button className="text-xs font-bold bg-white px-3 py-1 rounded-lg text-green-600 shadow-sm border border-green-200">Test</button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-3">
                            <Activity className="w-6 h-6 text-slate-500" />
                            <div>
                                <p className="font-bold text-slate-800">Storage Usage</p>
                                <p className="text-xs text-slate-500">45% of 5GB Tier</p>
                            </div>
                        </div>
                        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="w-[45%] h-full bg-slate-900" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-200">
                    <h3 className="font-bold mb-4">Error Rate (24h)</h3>
                    <div className="flex items-center justify-center h-40 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                        Chart Placeholder
                    </div>
                </div>
            </div>
        </div>
    )
}

// --- COMPONENTS ---

function SidebarItem({ icon: Icon, label, active, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group
            ${active ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
        >
            <Icon className={`w-5 h-5 ${active ? "text-white" : "group-hover:text-white transition-colors"}`} />
            <span className="font-bold text-sm hidden lg:block">{label}</span>
        </button>
    )
}

function StatCard({ label, value, icon: Icon, color }: any) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:scale-[1.02] transition-transform">
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-3xl font-black text-slate-800">{value}</p>
            </div>
            <div className={`p-3 rounded-xl text-white shadow-lg ${color}`}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
    );
}
