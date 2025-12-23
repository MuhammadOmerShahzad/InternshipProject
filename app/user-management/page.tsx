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
    Upload,
    Copy,
    X
} from 'lucide-react';
import AddUserDrawer from '@/components/modules/user-management/AddUserDrawer';
import EditUserDrawer from '@/components/modules/user-management/EditUserDrawer';
import EditModulesDrawer from '@/components/modules/user-management/EditModulesDrawer';
import AddBranchDrawer from '@/components/modules/user-management/AddBranchDrawer';
import EditBranchDrawer from '@/components/modules/user-management/EditBranchDrawer';

export default function UserManagementPage() {
    const { user: _currentUser, loading: userLoading } = useUser();
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
    const handleEditClick = (user: User) => {
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
        <div className="p-4 md:p-6 max-w-full">
            {/* Header */}
            <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ fontFamily: 'TanseekModernW20' }}>
                ACTIVE USERS
            </h1>
            <div className="border-b border-gray-200 mb-4" />

            {/* Toolbar */}
            <div className="flex flex-wrap gap-2 mb-4">
                <button
                    onClick={() => setAddUserDrawerOpen(true)}
                    className="flex items-center gap-1 px-3 py-2 text-[#f15a22] hover:bg-orange-50 rounded-lg transition-colors text-sm"
                >
                    <Plus size={18} />
                    <span className="hidden sm:inline">Add a user</span>
                </button>
                <button
                    onClick={fetchUsers}
                    className="flex items-center gap-1 px-3 py-2 text-[#f15a22] hover:bg-orange-50 rounded-lg transition-colors text-sm"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    <span className="hidden sm:inline">Refresh</span>
                </button>
                <button
                    onClick={handleDeleteUsers}
                    disabled={selectedUsers.length === 0}
                    className="flex items-center gap-1 px-3 py-2 text-[#f15a22] hover:bg-orange-50 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Trash2 size={18} />
                    <span className="hidden sm:inline">Delete user</span>
                </button>
                <button
                    onClick={handleResetPassword}
                    disabled={selectedUsers.length !== 1}
                    className="flex items-center gap-1 px-3 py-2 text-[#f15a22] hover:bg-orange-50 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <KeyRound size={18} />
                    <span className="hidden sm:inline">Reset password</span>
                </button>
                <button
                    onClick={() => setAddBranchDrawerOpen(true)}
                    className="flex items-center gap-1 px-3 py-2 text-[#f15a22] hover:bg-orange-50 rounded-lg transition-colors text-sm"
                >
                    <Plus size={18} />
                    <span className="hidden sm:inline">Add a branch</span>
                </button>
                <button
                    onClick={() => setEditBranchDrawerOpen(true)}
                    className="flex items-center gap-1 px-3 py-2 text-[#f15a22] hover:bg-orange-50 rounded-lg transition-colors text-sm"
                >
                    <MapPin size={18} />
                    <span className="hidden sm:inline">Edit branch</span>
                </button>
                <button
                    className="flex items-center gap-1 px-3 py-2 text-[#f15a22] hover:bg-orange-50 rounded-lg transition-colors text-sm"
                    onClick={() => setNotification({ type: 'info', message: 'Upload feature coming soon!' })}
                >
                    <Upload size={18} />
                    <span className="hidden sm:inline">Upload accounts</span>
                </button>

                {/* Search */}
                <div className="flex-1 min-w-[200px] ml-auto">
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search active users list"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#f15a22]"
                        />
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="w-12 px-4 py-3 text-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 accent-[#f15a22]"
                                    />
                                </th>
                                <th className="px-4 py-3 text-left font-semibold">Display Name</th>
                                <th className="px-4 py-3 text-left font-semibold">Email</th>
                                <th className="px-4 py-3 text-left font-semibold">Branch</th>
                                <th className="px-4 py-3 text-left font-semibold">Role</th>
                                <th className="px-4 py-3 text-center font-semibold">Password</th>
                                <th className="px-4 py-3 text-center font-semibold">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                        <div className="flex items-center justify-center gap-2">
                                            <RefreshCw size={20} className="animate-spin" />
                                            Loading users...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.includes(user.id)}
                                                onChange={() => handleSelectUser(user.id)}
                                                className="w-4 h-4 accent-[#f15a22]"
                                            />
                                        </td>
                                        <td className="px-4 py-3">{user.name || 'N/A'}</td>
                                        <td className="px-4 py-3">{user.email || 'N/A'}</td>
                                        <td className="px-4 py-3">{user.branch_name || 'N/A'}</td>
                                        <td className="px-4 py-3">{user.role || 'N/A'}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => {
                                                    if (user.plain_password) {
                                                        navigator.clipboard.writeText(user.plain_password);
                                                        setCopiedPassword(user.id);
                                                        setTimeout(() => setCopiedPassword(null), 2000);
                                                        setNotification({ type: 'success', message: 'Password copied!' });
                                                    }
                                                }}
                                                className="inline-flex items-center justify-center p-2 text-[#f15a22] hover:bg-orange-50 rounded-lg transition-colors"
                                                title={user.plain_password ? 'Copy password' : 'No password stored'}
                                            >
                                                <Copy size={18} className={copiedPassword === user.id ? 'text-green-500' : ''} />
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-center relative">
                                            <button
                                                onClick={() => handleEditClick(user)}
                                                className="inline-flex items-center justify-center p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                <MoreVertical size={18} />
                                            </button>

                                            {/* Dropdown Menu */}
                                            {menuOpen === user.id && (
                                                <div className="absolute right-4 top-full mt-1 bg-white rounded-lg shadow-lg border z-50 min-w-[200px]">
                                                    <button
                                                        onClick={handleEditGeneralInfo}
                                                        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                                                    >
                                                        <Info size={18} className="text-[#f15a22]" />
                                                        Edit General Information
                                                    </button>
                                                    <button
                                                        onClick={handleEditModules}
                                                        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                                                    >
                                                        <Layers size={18} className="text-[#f15a22]" />
                                                        Edit Assigned Modules
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Click outside to close menu */}
            {menuOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(null)}
                />
            )}

            {/* Notification */}
            {notification && (
                <div
                    className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${notification.type === 'success'
                        ? 'bg-green-500 text-white'
                        : notification.type === 'error'
                            ? 'bg-red-500 text-white'
                            : 'bg-yellow-400 text-gray-900'
                        }`}
                >
                    <span>{notification.message}</span>
                    <button onClick={() => setNotification(null)}>
                        <X size={18} />
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
    );
}
