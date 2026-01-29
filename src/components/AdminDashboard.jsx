import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, Eye, Archive, Trash2, RefreshCw, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from './ui/ConfirmModal';

export function AdminDashboard({ adminPassword, onClose }) {
    const [activeTab, setActiveTab] = useState('feedbacks');
    const [feedbacks, setFeedbacks] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ total: 0, new: 0, read: 0 });
    const [authError, setAuthError] = useState(false);
    const [feedbackToDelete, setFeedbackToDelete] = useState(null);

    const fetchFeedbacks = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/feedback/admin/feedbacks?limit=100', {
                headers: { 'x-admin-auth': adminPassword }
            });

            if (response.status === 403 || response.status === 401) {
                setAuthError(true);
                return;
            }

            if (!response.ok) throw new Error('Auth failed');
            const data = await response.json();

            setFeedbacks(data.feedbacks);

            const newCount = data.feedbacks.filter(f => f.status === 'new').length;
            const readCount = data.feedbacks.filter(f => f.status === 'read').length;

            setStats({
                total: data.total,
                new: newCount,
                read: readCount
            });
        } catch (error) {
            console.error(error);
            toast.error('Erreur chargement feedbacks');
        } finally {
            setLoading(false);
        }
    };

    const fetchOnlineUsers = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/feedback/admin/online-users', {
                headers: { 'x-admin-auth': adminPassword }
            });

            if (response.status === 403 || response.status === 401) {
                setAuthError(true);
                return;
            }

            if (!response.ok) throw new Error('Auth failed');
            const data = await response.json();
            setOnlineUsers(data.users);
        } catch (error) {
            console.error(error);
            toast.error('Erreur chargement utilisateurs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedbacks();
        fetchOnlineUsers();
    }, []);

    useEffect(() => {
        if (activeTab === 'feedbacks') fetchFeedbacks();
        if (activeTab === 'live') fetchOnlineUsers();
    }, [activeTab]);

    const updateStatus = async (id, newStatus) => {
        try {
            await fetch(`/api/feedback/admin/feedbacks/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-auth': adminPassword
                },
                body: JSON.stringify({ status: newStatus })
            });

            toast.success('Statut mis à jour');
            fetchFeedbacks();
        } catch (error) {
            toast.error('Erreur mise à jour');
        }
    };

    const requestDeleteFeedback = (id) => {
        setFeedbackToDelete(id);
    };

    const performDeleteFeedback = async () => {
        if (!feedbackToDelete) return;

        try {
            await fetch(`/api/feedback/admin/feedbacks/${feedbackToDelete}`, {
                method: 'DELETE',
                headers: { 'x-admin-auth': adminPassword }
            });

            toast.success('Supprimé');
            fetchFeedbacks();
        } catch (error) {
            toast.error('Erreur suppression');
        }
        setFeedbackToDelete(null);
    };


    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center p-20 animate-in fade-in">
                    <RefreshCw className="w-12 h-12 animate-spin text-blue-500 mb-4" />
                    <p className="text-gray-500 font-medium">Connexion sécurisée...</p>
                </div>
            );
        }

        if (authError) {
            return (
                <div className="flex flex-col items-center justify-center p-12 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl text-center animate-in zoom-in-95">
                    <div className="p-4 bg-red-100 dark:bg-red-900/50 rounded-full mb-4">
                        <X className="w-12 h-12 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-xl font-bold text-red-700 dark:text-red-300 mb-2">Accès Refusé</h3>
                    <p className="text-red-600/80 dark:text-red-400/80 mb-6">Le code administrateur est incorrect.</p>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
                    >
                        Fermer
                    </button>
                </div>
            );
        }

        return (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <StatCard
                        icon={MessageSquare} label="Total Feedbacks" value={stats.total} color="blue"
                    />
                    <StatCard
                        icon={Check} label="Nouveaux" value={stats.new} color="yellow"
                    />
                    <StatCard
                        icon={Users} label="En Ligne Maintenant" value={onlineUsers.length} color="green"
                    />
                </div>

                {/* Tabs Control */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-6">
                    <div className="flex border-b border-slate-200 dark:border-slate-800">
                        <TabButton
                            active={activeTab === 'feedbacks'}
                            onClick={() => setActiveTab('feedbacks')}
                            icon={MessageSquare} label="Feedbacks"
                        />
                        <TabButton
                            active={activeTab === 'live'}
                            onClick={() => setActiveTab('live')}
                            icon={Users} label="Live Users"
                        />
                    </div>

                    <div className="p-6 min-h-[400px]">
                        {activeTab === 'feedbacks' ? (
                            <FeedbackList
                                feedbacks={feedbacks}
                                onUpdate={updateStatus}
                                onDelete={requestDeleteFeedback}
                            />
                        ) : (
                            <UserList users={onlineUsers} />
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-slate-950 z-[99999] overflow-y-auto font-sans selection:bg-indigo-500/30">
            {/* Background Decor */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-purple-500/5 blur-[100px] rounded-full" />
            </div>

            <div className="max-w-7xl mx-auto p-4 md:p-10 relative z-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-1 w-8 bg-indigo-500 rounded-full" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">System_Control_v2</span>
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter">
                            Admin <span className="text-indigo-500">Terminal</span>
                        </h1>
                        <p className="text-white/40 font-medium mt-2 tracking-wide">Monitoring en temps réel & Feedback Hub</p>
                    </div>

                    <button
                        onClick={onClose}
                        className="group flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 rounded-2xl transition-all duration-300 backdrop-blur-md"
                    >
                        <span className="text-xs font-black uppercase tracking-widest text-white/50 group-hover:text-red-400 transition-colors">Terminer_Session</span>
                        <div className="p-1.5 bg-white/5 group-hover:bg-red-500/20 rounded-lg transition-colors">
                            <X className="w-4 h-4 text-white/70 group-hover:text-red-400" />
                        </div>
                    </button>
                </div>

                {renderContent()}

                <ConfirmModal
                    isOpen={!!feedbackToDelete}
                    onClose={() => setFeedbackToDelete(null)}
                    onConfirm={performDeleteFeedback}
                    title="Supprimer le feedback ?"
                    message="Cette action est irréversible. Voulez-vous vraiment supprimer ce message de la base de données ?"
                    confirmText="Supprimer"
                    variant="danger"
                />
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color }) {
    const variants = {
        blue: {
            bg: 'bg-indigo-500/10',
            border: 'border-indigo-500/20',
            icon: 'text-indigo-400',
            glow: 'shadow-[0_0_20px_rgba(99,102,241,0.15)]'
        },
        yellow: {
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
            icon: 'text-amber-400',
            glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]'
        },
        green: {
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            icon: 'text-emerald-400',
            glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]'
        }
    };

    const style = variants[color];

    return (
        <div className={`p-4 md:p-6 rounded-[2rem] bg-white/[0.03] border ${style.border} ${style.glow} backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:bg-white/[0.05]`}>
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl ${style.bg} flex items-center justify-center mb-4`}>
                <Icon className={`w-5 h-5 md:w-6 md:h-6 ${style.icon}`} />
            </div>
            <div>
                <p className="text-2xl md:text-4xl font-black text-white tracking-tighter mb-0.5">{value}</p>
                <p className="text-[8px] md:text-[10px] uppercase font-black tracking-[0.2em] text-white/30 truncate">{label}</p>
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon: Icon, label }) {
    return (
        <button
            onClick={onClick}
            className={`relative flex-1 py-6 font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-500 flex items-center justify-center gap-3 ${active
                ? 'text-white'
                : 'text-white/30 hover:text-white/60 hover:bg-white/[0.02]'
                }`}
        >
            {active && (
                <div className="absolute inset-x-4 bottom-0 h-1 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.6)] animate-in slide-in-from-bottom-2" />
            )}
            <Icon className={`w-4 h-4 ${active ? 'text-indigo-400' : ''}`} />
            {label}
        </button>
    );
}

function FeedbackList({ feedbacks, onUpdate, onDelete }) {
    if (feedbacks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 bg-white/[0.02] rounded-[2rem] border border-dashed border-white/10 uppercase tracking-widest text-white/20 font-black text-xs">
                <MessageSquare className="w-12 h-12 mb-4 opacity-10" />
                No_Data_Found
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-6">
            {feedbacks.map(f => (
                <div key={f.id} className={`group relative p-6 rounded-3xl border transition-all duration-300 hover:bg-white/[0.05] ${f.status === 'new'
                    ? 'border-amber-500/30 bg-amber-500/[0.02] shadow-[0_0_30px_rgba(245,158,11,0.05)]'
                    : 'border-white/5 bg-white/[0.02]'
                    }`}>
                    {f.status === 'new' && (
                        <div className="absolute top-6 right-6 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <span className="text-[10px] font-black text-amber-500/80 uppercase tracking-widest">Unread</span>
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-xl shadow-inner uppercase font-black text-white/50 border border-white/5">
                                {f.username.charAt(0)}
                            </div>
                            <div>
                                <h4 className="font-bold text-white tracking-wide">{f.username}</h4>
                                <p className="text-[10px] font-mono text-white/20 uppercase tracking-tighter">
                                    {new Date(f.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>

                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${f.type === 'bug' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                            f.type === 'suggestion' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                                'bg-blue-500/10 border-blue-500/30 text-blue-400'
                            }`}>
                            {f.type}
                        </div>
                    </div>

                    <div className="bg-slate-950/40 rounded-2xl p-5 mb-6 border border-white/5">
                        <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap font-medium">{f.content}</p>
                    </div>

                    <div className="flex items-center justify-end gap-3">
                        <button
                            onClick={() => onUpdate(f.id, f.status === 'read' ? 'new' : 'read')}
                            className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 ${f.status === 'read'
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white shadow-emerald-500/10'
                                : 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-500/20'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                {f.status === 'read' ? <Check className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                {f.status === 'read' ? 'Lu' : 'Marquer_Lu'}
                            </div>
                        </button>
                        <button
                            onClick={() => onDelete(f.id)}
                            className="p-2.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl transition-all border border-red-500/20 active:scale-95"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

function UserList({ users }) {
    if (users.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 bg-white/[0.02] rounded-[2rem] border border-dashed border-white/10 uppercase tracking-widest text-white/20 font-black text-xs">
                <Users className="w-12 h-12 mb-4 opacity-10" />
                No_Active_Signals
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-6 duration-500">
            {users.map((u, i) => (
                <div key={i} className="group p-6 bg-white/[0.03] border border-white/5 rounded-[2rem] transition-all duration-300 hover:bg-white/[0.06] hover:border-indigo-500/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-2xl rounded-full -mr-12 -mt-12" />

                    <div className="flex items-center justify-between mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-500">
                            👤
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_15px_#6366f1]" />
                            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-tighter mt-1">Live_Node</span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <h4 className="text-lg font-black text-white tracking-tight">{u.username}</h4>
                        <div className="flex flex-col gap-1">
                            <p className="text-[10px] font-mono text-white/20 uppercase">Network_ID: <span className="text-white/40">{String(u.id).substring(0, 12)}</span></p>
                            <p className="text-[10px] font-mono text-indigo-400/50 uppercase italic">Uptime: {new Date(u.connectedAt).toLocaleTimeString()}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
