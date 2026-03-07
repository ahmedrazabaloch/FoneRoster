/**
 * SuperAdminPage.jsx — Super Admin Control Panel
 *
 * Route: /super-admin
 * Access: SUPER_ADMIN only (enforced by ProtectedRoute)
 *
 * Contains system management features:
 *   - Authority Configuration (name + signature image)
 *   - User Management (Phase 10)
 *   - Permissions management
 *   - Audit logging access
 *
 * Navigation to Super Admin happens through the header button.
 * SUPER_ADMIN should use /admin as the main dashboard view.
 */
import React, { useState, useEffect } from 'react';
import { Shield, Upload, Save, Loader, Image, Trash2, Users } from 'lucide-react';
import { authorityService } from '../../services/firebaseService';
import { useAuth } from '../../hooks/useAuth';
import { UserManagementPanel } from '../components/UserManagementPanel';
import { AuthorityConfigPanel } from '../components/AuthorityConfigPanel';

export const SuperAdminPage = () => {
    // eslint-disable-next-line no-unused-vars
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('authority');
    const [loading, setLoading] = useState(true);

    // TABS configuration
    const TABS = [
        { id: 'authority', label: 'Authority Config', icon: Image },
        { id: 'users', label: 'User Management', icon: Users },
    ];

    useEffect(() => {
        const unsub = authorityService.subscribe(
            () => setLoading(false),
            () => setLoading(false)
        );
        return unsub;
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader className="animate-spin text-gray-400" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <div className="bg-white border-4 border-black shadow-brutal-lg">
                {/* Header */}
                <div className="flex items-center gap-3 p-8 pb-0">
                    <div className="bg-red-600 p-2 border-2 border-black shadow-brutal-sm">
                        <Shield className="text-white" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-wide">Super Admin</h2>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">System Control Panel</p>
                    </div>
                </div>

                {/* Tab Bar */}
                <div className="flex border-b-2 border-black mt-6 px-8">
                    {TABS.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 -mb-0.5 transition-colors ${activeTab === id
                                    ? 'border-black text-black'
                                    : 'border-transparent text-gray-400 hover:text-gray-700'
                                }`}
                        >
                            <Icon size={14} />
                            {label}
                        </button>
                    ))}
                </div>

                <div className="p-8">
                    {/* ── Authority Config Tab ── */}
                    {activeTab === 'authority' && <AuthorityConfigPanel />}

                    {/* ── User Management Tab ── */}
                    {activeTab === 'users' && <UserManagementPanel />}
                </div>
            </div>
        </div>
    );
};
