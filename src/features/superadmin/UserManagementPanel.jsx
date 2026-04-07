/**
 * UserManagementPanel.jsx — Phase 10
 * Displayed inside SuperAdminPage under the "User Management" tab.
 * Only accessible by SUPER_ADMIN.
 */
import React, { useState, useEffect, useContext } from 'react';
import { UserPlus, Edit2, Power, RefreshCw, Loader, Shield, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { adminService, MODULE_PERMISSIONS } from '../../services/adminService';
import { AdminFormModal } from './AdminFormModal';
import { AuthContext } from '../../auth/AuthContext';
import { formatPhone } from '../../utils/sanitizeInput';

const ROLE_BADGE = {
    admin: 'bg-blue-100 text-blue-800 border-blue-300',
    team_user: 'bg-purple-100 text-purple-800 border-purple-300',
};

export const UserManagementPanel = () => {
    const { user } = useContext(AuthContext);
    const creatorEmail = user?.email || 'superadmin';

    const [admins, setAdmins] = useState([]);
    const [listLoading, setListLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [saving, setSaving] = useState(false);
    const [actionLoading, setActionLoading] = useState({});

    // Subscribe to admins collection
    useEffect(() => {
        const unsub = adminService.subscribeAll(
            (data) => { setAdmins(data); setListLoading(false); },
            () => setListLoading(false)
        );
        return unsub;
    }, []);

    const openCreate = () => { setEditingAdmin(null); setModalOpen(true); };
    const openEdit = (admin) => { setEditingAdmin(admin); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setEditingAdmin(null); };

    const handleSave = async ({ name, phone, password, role, permissions }) => {
        setSaving(true);
        try {
            if (editingAdmin) {
                // Edit: update profile + permissions  
                await adminService.updateAdmin(editingAdmin.uid, { name, role }, creatorEmail);
                await adminService.updatePermissions(editingAdmin.uid, permissions, creatorEmail);
                toast.success('Admin updated successfully.');
            } else {
                // Create new admin
                await adminService.createAdmin({ name, phone, password, role, permissions }, creatorEmail);
                toast.success(`Admin account created. Login: ${phone} / password was set.`);
            }
            closeModal();
        } catch (err) {
            toast.error(err.message || 'Failed to save admin.');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (admin) => {
        setActionLoading(prev => ({ ...prev, [admin.uid]: true }));
        try {
            await adminService.setActiveStatus(admin.uid, !admin.isActive, creatorEmail);
            toast.success(admin.isActive ? `${admin.name} deactivated.` : `${admin.name} activated.`);
        } catch (err) {
            toast.error(err.message || 'Action failed.');
        } finally {
            setActionLoading(prev => ({ ...prev, [admin.uid]: false }));
        }
    };

    const handlePasswordReset = async (admin) => {
        setActionLoading(prev => ({ ...prev, [admin.uid + '_reset']: true }));
        try {
            await adminService.sendPasswordReset(admin.phone);
            toast.success(`Password reset email sent to ${admin.phone}@admin.local`);
        } catch (err) {
            toast.error(err.message || 'Failed to send reset email.');
        } finally {
            setActionLoading(prev => ({ ...prev, [admin.uid + '_reset']: false }));
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
                        <Shield size={16} />
                        Admin Accounts
                    </h3>
                    <p className="text-[10px] text-gray-400 uppercase font-bold mt-0.5">
                        {admins.length} account{admins.length !== 1 ? 's' : ''} registered
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2.5 font-black text-xs uppercase border-2 border-black bg-black text-white shadow-brutal-sm hover:translate-y-0.5 hover:shadow-none transition-all"
                >
                    <UserPlus size={14} />
                    New Admin
                </button>
            </div>

            {/* Admin List */}
            {listLoading ? (
                <div className="flex justify-center py-10">
                    <Loader size={24} className="animate-spin text-gray-400" />
                </div>
            ) : admins.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-gray-300 text-gray-400 font-bold text-sm uppercase">
                    No admin accounts yet. Create the first one.
                </div>
            ) : (
                <div className="space-y-3">
                    {admins.map(admin => {
                        const activePermissions = MODULE_PERMISSIONS.filter(m => admin.permissions?.[m.key]);
                        const isTogglingStatus = actionLoading[admin.uid];
                        const isResetting = actionLoading[admin.uid + '_reset'];

                        return (
                            <div key={admin.uid}
                                className={`border-2 border-black p-4 ${admin.isActive ? 'bg-white' : 'bg-red-50 opacity-70'}`}>
                                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-black text-sm uppercase">{admin.name}</span>
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 border ${ROLE_BADGE[admin.role] || 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                                                {admin.role?.replace('_', ' ')}
                                            </span>
                                            {admin.isActive
                                                ? <CheckCircle size={14} className="text-green-500" />
                                                : <XCircle size={14} className="text-red-400" />
                                            }
                                        </div>
                                        <div className="text-xs font-mono text-gray-500 mt-0.5">
                                            {formatPhone(admin.phone)} · login: {admin.phone}@admin.local
                                        </div>

                                        {/* Permissions */}
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {activePermissions.length === 0 ? (
                                                <span className="text-[10px] text-gray-400 font-bold uppercase">No permissions</span>
                                            ) : activePermissions.map(m => (
                                                <span key={m.key} className="text-[10px] font-bold uppercase bg-gray-100 border border-gray-300 px-1.5 py-0.5">
                                                    {m.label}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button onClick={() => openEdit(admin)}
                                            className="p-2 border-2 border-black bg-yellow-300 shadow-brutal-sm hover:translate-y-0.5 hover:shadow-none transition-all"
                                            title="Edit admin">
                                            <Edit2 size={14} />
                                        </button>

                                        <button onClick={() => handleToggleStatus(admin)}
                                            disabled={isTogglingStatus}
                                            className={`p-2 border-2 border-black shadow-brutal-sm hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50 ${admin.isActive ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
                                            title={admin.isActive ? 'Deactivate' : 'Activate'}>
                                            {isTogglingStatus ? <Loader size={14} className="animate-spin" /> : <Power size={14} />}
                                        </button>

                                        <button onClick={() => handlePasswordReset(admin)}
                                            disabled={isResetting}
                                            className="p-2 border-2 border-black bg-blue-500 text-white shadow-brutal-sm hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50"
                                            title="Send password reset">
                                            {isResetting ? <Loader size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {modalOpen && (
                <AdminFormModal
                    admin={editingAdmin}
                    onSave={handleSave}
                    onClose={closeModal}
                    saving={saving}
                />
            )}
        </div>
    );
};
