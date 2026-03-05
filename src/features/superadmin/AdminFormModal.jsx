/**
 * AdminFormModal.jsx — Phase 10
 * Used for both creating and editing admin accounts.
 */
import React, { useState, useEffect } from 'react';
import { X, Loader, Eye, EyeOff } from 'lucide-react';
import { MODULE_PERMISSIONS, DEFAULT_PERMISSIONS } from '../../services/adminService';
import { ROLES } from '../../utils/rbac';

const FIELD = 'w-full border-2 border-black p-2 font-bold text-sm focus:outline-none focus:shadow-brutal-sm bg-white';
const LABEL = 'block text-[10px] font-black uppercase tracking-widest mb-1 text-gray-500';

export const AdminFormModal = ({ admin, onSave, onClose, saving }) => {
    const isEdit = Boolean(admin);

    const [name, setName] = useState(admin?.name || '');
    const [phone, setPhone] = useState(admin?.phone || '');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState(admin?.role || ROLES.ADMIN);
    const [permissions, setPermissions] = useState({ ...DEFAULT_PERMISSIONS, ...(admin?.permissions || {}) });
    const [error, setError] = useState('');

    useEffect(() => {
        if (admin) {
            setName(admin.name || '');
            setPhone(admin.phone || '');
            setRole(admin.role || ROLES.ADMIN);
            setPermissions({ ...DEFAULT_PERMISSIONS, ...(admin.permissions || {}) });
        }
    }, [admin]);

    const togglePerm = (key) => {
        setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) return setError('Name is required.');
        if (!phone.trim()) return setError('Phone number is required.');
        if (!isEdit && !password) return setError('Password is required for new accounts.');
        if (!isEdit && password.length < 6) return setError('Password must be at least 6 characters.');

        onSave({ name, phone, password: password || undefined, role, permissions });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <div className="bg-white border-4 border-black shadow-brutal-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b-2 border-black bg-gray-900 text-white">
                    <h3 className="font-black text-sm uppercase tracking-widest">
                        {isEdit ? 'Edit Admin' : 'Create Admin Account'}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Name */}
                    <div>
                        <label className={LABEL}>Full Name</label>
                        <input value={name} onChange={e => setName(e.target.value)}
                            placeholder="e.g. Ali Hassan" className={FIELD} style={{ minHeight: 44 }} />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className={LABEL}>Phone Number (used as login ID)</label>
                        <input value={phone} onChange={e => setPhone(e.target.value)}
                            placeholder="e.g. 0312-3456789" className={FIELD} style={{ minHeight: 44 }}
                            disabled={isEdit} // phone is immutable after creation (it's the auth key)
                        />
                        {isEdit && (
                            <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase">
                                Phone cannot be changed after creation (it is the login identifier)
                            </p>
                        )}
                    </div>

                    {/* Password — only shown when creating */}
                    {!isEdit && (
                        <div>
                            <label className={LABEL}>Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Min. 6 characters"
                                    className={FIELD + ' pr-10'}
                                    style={{ minHeight: 44 }}
                                />
                                <button type="button"
                                    onClick={() => setShowPassword(p => !p)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Role */}
                    <div>
                        <label className={LABEL}>Role</label>
                        <select value={role} onChange={e => setRole(e.target.value)}
                            className={FIELD} style={{ minHeight: 44 }}>
                            <option value={ROLES.ADMIN}>ADMIN — Full CRUD access</option>
                            <option value={ROLES.TEAM_USER}>TEAM_USER — Read-only access</option>
                        </select>
                    </div>

                    {/* Module Permissions */}
                    <div>
                        <label className={LABEL}>Module Permissions</label>
                        <div className="border-2 border-black divide-y-2 divide-black">
                            {MODULE_PERMISSIONS.map(({ key, label }) => (
                                <label key={key}
                                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={!!permissions[key]}
                                        onChange={() => togglePerm(key)}
                                        className="w-4 h-4 accent-black"
                                    />
                                    <span className="text-sm font-bold">{label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-xs font-bold text-red-600 bg-red-50 border-2 border-red-300 p-2">
                            {error}
                        </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-3 font-black text-xs uppercase border-2 border-black hover:bg-gray-100 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving}
                            className="flex-1 py-3 font-black text-xs uppercase border-2 border-black bg-black text-white shadow-brutal-sm hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                            {saving ? <><Loader size={14} className="animate-spin" />Saving...</> : isEdit ? 'Save Changes' : 'Create Account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
