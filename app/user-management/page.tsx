'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/lib/context/UserContext';
import { getUsers, deleteUsers, resetUserPassword, User } from '@/lib/actions/users';
import {
    Search,
    Plus,
    RefreshCw,
    Trash2,
    KeyRound,
    MapPin,
    MoreVertical,
    Info,
    Layers,
    Copy,
    X
} from 'lucide-react';
import AppBar from '@/components/layout/AppBar';
import Drawer from '@/components/layout/Drawer';
import AddUserDrawer from '@/components/modules/user-management/AddUserDrawer';
import EditUserDrawer from '@/components/modules/user-management/EditUserDrawer';
import EditModulesDrawer from '@/components/modules/user-management/EditModulesDrawer';
import AddBranchDrawer from '@/components/modules/user-management/AddBranchDrawer';
import EditBranchDrawer from '@/components/modules/user-management/EditBranchDrawer';

export default function UserManagementPage() {
    const { user, loading: userLoading } = useUser();

    // AppBar/Drawer state
    const [mobileOpen, setMobileOpen] = useState(false);
    const [desktopOpen, setDesktopOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile for margin calculation
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

    // Drawer states
    const [addUserDrawerOpen, setAddUserDrawerOpen] = useState(false);
    const [editUserDrawerOpen, setEditUserDrawerOpen] = useState(false);
    const [editModulesDrawerOpen, setEditModulesDrawerOpen] = useState(false);
    const [addBranchDrawerOpen, setAddBranchDrawerOpen] = useState(false);
    const [editBranchDrawerOpen, setEditBranchDrawerOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Menu state
    const [menuOpen, setMenuOpen] = useState<string | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number; right: number }>({ top: 0, right: 0 });

    // Notification states
    const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    const [copiedPassword, setCopiedPassword] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        const { users: fetchedUsers, error } = await getUsers();
        if (error) {
            setNotification({ type: 'error', message: error });
        } else {
            setUsers(fetchedUsers);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Filter users based on search
    const filteredUsers = users.filter((user) =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handle user selection
    const handleSelectUser = (userId: string) => {
        setSelectedUsers((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSelectAll = () => {
        if (selectedUsers.length === filteredUsers.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(filteredUsers.map((u) => u.id));
        }
    };

    // Handle delete users
    const handleDeleteUsers = async () => {
        if (selectedUsers.length === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedUsers.length} user(s)?`)) return;

        const { success, error } = await deleteUsers(selectedUsers);
        if (error) {
            setNotification({ type: 'error', message: error });
        } else if (success) {
            setNotification({ type: 'success', message: `${selectedUsers.length} user(s) deleted successfully` });
            setSelectedUsers([]);
            fetchUsers();
        }
    };

    // Handle reset password
    const handleResetPassword = async () => {
        if (selectedUsers.length !== 1) return;

        const { password, error } = await resetUserPassword(selectedUsers[0]);
        if (error) {
            setNotification({ type: 'error', message: error });
        } else if (password) {
            setNotification({ type: 'success', message: `Password reset! New password: ${password}` });
            fetchUsers();
        }
    };

    // Handle edit menu
    const handleEditClick = (user: User, event: React.MouseEvent<HTMLButtonElement>) => {
        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();
        setMenuPosition({
            top: rect.bottom + 8,
            right: window.innerWidth - rect.right
        });
        setSelectedUser(user);
        setMenuOpen(menuOpen === user.id ? null : user.id);
    };

    const handleEditGeneralInfo = () => {
        setEditUserDrawerOpen(true);
        setMenuOpen(null);
    };

    const handleEditModules = () => {
        setEditModulesDrawerOpen(true);
        setMenuOpen(null);
    };

    // Auto-hide notification
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    if (userLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f15a22]" />
            </div>
        );
    }

    return (
        <>
            <AppBar
                user={user}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
                desktopOpen={desktopOpen}
                setDesktopOpen={setDesktopOpen}
            />

            <Drawer
                user={user}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
                desktopOpen={desktopOpen}
                setDesktopOpen={setDesktopOpen}
            />

            <main
                className="p-6 md:p-8 mt-16 min-h-screen bg-gray-50/50 dark:bg-[#121212]"
                style={{
                    marginLeft: !isMobile ? '65px' : '0px',
                }}
            >
                <div className="max-w-[1600px] mx-auto">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">User Management</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage users, roles, and branch access controls</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#f15a22] transition-colors" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2.5 w-[280px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f15a22]/10 focus:border-[#f15a22] transition-all shadow-sm dark:text-white dark:placeholder-gray-400"
                                />
                            </div>
                            <button
                                onClick={fetchUsers}
                                className={`p-2.5 text-gray-500 dark:text-gray-400 hover:text-[#f15a22] hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl transition-all ${loading ? 'animate-spin' : ''}`}
                                title="Refresh list"
                            >
                                <RefreshCw size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Action Toolbar */}
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        <button
                            onClick={() => setAddUserDrawerOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-[#f15a22] text-white rounded-xl hover:bg-[#d14e1f] transition-all shadow-lg shadow-orange-500/20 active:scale-95 font-medium"
                        >
                            <Plus size={20} strokeWidth={2.5} />
                            <span>Add User</span>
                        </button>

                        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2" />

                        <button
                            onClick={() => setAddBranchDrawerOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-all font-medium"
                        >
                            <Plus size={18} />
                            <span>Add Branch</span>
                        </button>

                        <button
                            onClick={() => setEditBranchDrawerOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-all font-medium"
                        >
                            <MapPin size={18} />
                            <span>Edit Branch</span>
                        </button>

                        {/* Temporarily disabled
                        <button
                            onClick={() => setNotification({ type: 'info', message: 'Upload feature coming soon!' })}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-medium"
                        >
                            <Upload size={18} />
                            <span>Upload CSV</span>
                        </button>
                        */}

                        {/* Bulk Actions - Only visible when checked */}
                        {selectedUsers.length > 0 && (
                            <div className="flex items-center gap-3 ml-auto animate-in fade-in slide-in-from-right-4 duration-200">
                                <span className="text-sm font-medium text-gray-900 dark:text-white bg-orange-50 dark:bg-orange-900/30 px-3 py-1 rounded-lg">
                                    {selectedUsers.length} selected
                                </span>

                                {selectedUsers.length === 1 && (
                                    <button
                                        onClick={handleResetPassword}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 text-orange-600 border border-orange-200 dark:border-orange-800 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all font-medium"
                                    >
                                        <KeyRound size={18} />
                                        <span>Reset Password</span>
                                    </button>
                                )}

                                <button
                                    onClick={handleDeleteUsers}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 font-medium"
                                >
                                    <Trash2 size={18} />
                                    <span>Delete</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Main Content Card */}
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-visible">
                        <div className="overflow-x-auto overflow-y-visible">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                                        <th className="w-16 py-4 px-6 text-left">
                                            <div className="flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                                                    onChange={handleSelectAll}
                                                    className="w-5 h-5 rounded-md border-gray-300 dark:border-gray-600 text-[#f15a22] focus:ring-[#f15a22] dark:bg-gray-700"
                                                />
                                            </div>
                                        </th>
                                        <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User Details</th>
                                        <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Branch & Role</th>
                                        <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Credentials</th>
                                        <th className="py-4 px-6 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center">
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#f15a22]" />
                                                    <span className="text-gray-500 text-sm">Loading users...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center">
                                                <div className="flex flex-col items-center justify-center gap-2 text-gray-400 dark:text-gray-500">
                                                    <Search size={48} strokeWidth={1} />
                                                    <p className="text-gray-900 dark:text-white font-medium mt-2">No users found</p>
                                                    <p className="text-sm">Try adjusting your search terms</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map((user) => (
                                            <tr
                                                key={user.id}
                                                className={`group hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors ${selectedUsers.includes(user.id) ? 'bg-orange-50/30 dark:bg-orange-900/10' : ''}`}
                                            >
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center justify-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedUsers.includes(user.id)}
                                                            onChange={() => handleSelectUser(user.id)}
                                                            className="w-5 h-5 rounded-md border-gray-300 dark:border-gray-600 text-[#f15a22] focus:ring-[#f15a22] dark:bg-gray-700"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold border-2 border-white dark:border-gray-800 shadow-sm">
                                                            {user.name?.charAt(0).toUpperCase() || '?'}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{user.name || 'Unknown User'}</h3>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email || 'No email provided'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white font-medium">
                                                            <MapPin size={14} className="text-gray-400" />
                                                            {user.branch_name || 'No Branch'}
                                                        </div>
                                                        <span className={`inline-flex w-fit items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'Admin'
                                                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                                                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                                                            }`}>
                                                            {user.role || 'No Role'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    {user.plain_password ? (
                                                        <div className="flex items-center gap-2 group/pass">
                                                            <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm text-gray-600 dark:text-gray-300 font-mono">
                                                                ••••••••
                                                            </code>
                                                            <button
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(user.plain_password || '');
                                                                    setCopiedPassword(user.id);
                                                                    setTimeout(() => setCopiedPassword(null), 2000);
                                                                    setNotification({ type: 'success', message: 'Password copied!' });
                                                                }}
                                                                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors opacity-0 group-hover/pass:opacity-100"
                                                                title="Copy password"
                                                            >
                                                                {copiedPassword === user.id ? (
                                                                    <span className="text-green-500 font-bold text-xs">Copied!</span>
                                                                ) : (
                                                                    <Copy size={14} />
                                                                )}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 dark:text-gray-500 italic">Encrypted</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="relative inline-block">
                                                        <button
                                                            onClick={(e) => handleEditClick(user, e)}
                                                            className={`p-2 rounded-lg transition-colors ${menuOpen === user.id
                                                                ? 'bg-orange-100 dark:bg-orange-900/30 text-[#f15a22]'
                                                                : 'text-gray-400 hover:text-[#f15a22] hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                                                }`}
                                                        >
                                                            <MoreVertical size={20} />
                                                        </button>

                                                        {/* Dropdown Menu */}
                                                        {menuOpen === user.id && (
                                                            <>
                                                                <div
                                                                    className="fixed inset-0 z-[100]"
                                                                    onClick={() => setMenuOpen(null)}
                                                                />
                                                                <div
                                                                    className="fixed w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-[101] overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right"
                                                                    style={{
                                                                        top: `${menuPosition.top}px`,
                                                                        right: `${menuPosition.right}px`
                                                                    }}
                                                                >
                                                                    <div className="p-1">
                                                                        <button
                                                                            onClick={handleEditGeneralInfo}
                                                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                                                                        >
                                                                            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                                                                                <Info size={16} />
                                                                            </div>
                                                                            <div>
                                                                                <div className="font-medium">Edit Details</div>
                                                                                <div className="text-xs text-gray-500 dark:text-gray-400">Name, email & roles</div>
                                                                            </div>
                                                                        </button>
                                                                        <button
                                                                            onClick={handleEditModules}
                                                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                                                                        >
                                                                            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-md">
                                                                                <Layers size={16} />
                                                                            </div>
                                                                            <div>
                                                                                <div className="font-medium">Modules</div>
                                                                                <div className="text-xs text-gray-500 dark:text-gray-400">Manage permissions</div>
                                                                            </div>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer / Pagination (Placeholder for now) */}
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                            <div>Showing {filteredUsers.length} users</div>
                            {/* Add pagination here if needed */}
                        </div>
                    </div>

                    {/* Notification Toast */}
                    {notification && (
                        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in slide-in-from-bottom-4 duration-300 ${notification.type === 'success'
                            ? 'bg-white dark:bg-gray-800 border-green-100 dark:border-green-800 text-green-700 dark:text-green-400 shadow-green-100'
                            : notification.type === 'error'
                                ? 'bg-white dark:bg-gray-800 border-red-100 dark:border-red-800 text-red-700 dark:text-red-400 shadow-red-100'
                                : 'bg-white dark:bg-gray-800 border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-400 shadow-blue-100'
                            }`}>
                            <div className={`p-1.5 rounded-full ${notification.type === 'success' ? 'bg-green-100' : notification.type === 'error' ? 'bg-red-100' : 'bg-blue-100'
                                }`}>
                                {notification.type === 'success' && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                                {notification.type === 'error' && <div className="w-2 h-2 bg-red-500 rounded-full" />}
                                {notification.type === 'info' && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                            </div>
                            <span className="font-medium">{notification.message}</span>
                            <button onClick={() => setNotification(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {/* Drawers */}
                    <AddUserDrawer
                        open={addUserDrawerOpen}
                        onClose={() => setAddUserDrawerOpen(false)}
                        onUserCreated={() => {
                            setNotification({ type: 'success', message: 'User created successfully!' });
                            fetchUsers();
                        }}
                    />

                    <EditUserDrawer
                        open={editUserDrawerOpen}
                        onClose={() => {
                            setEditUserDrawerOpen(false);
                            setSelectedUser(null);
                        }}
                        user={selectedUser}
                        onUserUpdated={() => {
                            setNotification({ type: 'success', message: 'User updated successfully!' });
                            fetchUsers();
                        }}
                    />

                    <EditModulesDrawer
                        open={editModulesDrawerOpen}
                        onClose={() => {
                            setEditModulesDrawerOpen(false);
                            setSelectedUser(null);
                        }}
                        user={selectedUser}
                        onModulesUpdated={() => {
                            setNotification({ type: 'success', message: 'Modules updated successfully!' });
                            fetchUsers();
                        }}
                    />

                    <AddBranchDrawer
                        open={addBranchDrawerOpen}
                        onClose={() => setAddBranchDrawerOpen(false)}
                        onBranchAdded={() => {
                            setNotification({ type: 'success', message: 'Branch added successfully!' });
                        }}
                    />

                    <EditBranchDrawer
                        open={editBranchDrawerOpen}
                        onClose={() => setEditBranchDrawerOpen(false)}
                        onBranchUpdated={() => {
                            setNotification({ type: 'success', message: 'Branch updated successfully!' });
                        }}
                    />
                </div>
            </main >
        </>
    );
}
