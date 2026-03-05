/**
 * SuperAdminPage.jsx — Super Admin Control Panel
 *
 * Route: /super-admin
 * Access: SUPER_ADMIN only (enforced by ProtectedRoute)
 *
 * Tabs:
 *   - Authority Configuration (name + signature image)
 *   - User Management (Phase 10)
 */
import React, { useState, useEffect, useRef } from 'react';
import { Shield, Upload, Save, Loader, Image, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { authorityService } from '../services/firebaseService';
import { useAuth } from '../hooks/useAuth';
import { UserManagementPanel } from '../features/superadmin/UserManagementPanel';

export const SuperAdminPage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('authority');
    const [authorityName, setAuthorityName] = useState('');
    const [signatureUrl, setSignatureUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef(null);

    useEffect(() => {
        const unsub = authorityService.subscribe(
            (data) => {
                setAuthorityName(data.authorityName || '');
                setSignatureUrl(data.signatureUrl || '');
                setLoading(false);
            },
            () => setLoading(false)
        );
        return unsub;
    }, []);

    const handleSignatureUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const { uploadSignature } = await import('../services/cloudinaryService');
            const url = await uploadSignature(file);
            setSignatureUrl(url);
            toast.success('Signature uploaded');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await authorityService.save({ authorityName, signatureUrl }, user?.uid || 'unknown');
            toast.success('Authority configuration saved');
        } catch (err) {
            toast.error('Failed to save: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader className="animate-spin text-gray-400" size={32} />
            </div>
        );
    }

    const TABS = [
        { id: 'authority', label: 'Authority Config', icon: Image },
        { id: 'users', label: 'User Management', icon: Users },
    ];

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
                    {activeTab === 'authority' && (
                        <div className="border-2 border-black p-6 bg-gray-50">
                            <h3 className="font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Image size={16} />
                                Authority Configuration
                            </h3>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold uppercase mb-1 text-gray-700">Authority Name</label>
                                    <input
                                        value={authorityName}
                                        onChange={e => setAuthorityName(e.target.value)}
                                        placeholder="e.g. Managing Director"
                                        className="w-full border-2 border-black p-2 font-bold focus:outline-none focus:shadow-brutal-sm bg-white"
                                        style={{ minHeight: 44 }}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase mb-1 text-gray-700">Signature Image</label>
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={`border-2 border-black bg-white flex items-center justify-center overflow-hidden shrink-0 ${uploading ? 'animate-pulse' : ''}`}
                                            style={{ width: 160, height: 60 }}
                                        >
                                            {signatureUrl ? (
                                                <img src={signatureUrl} alt="Signature" className="max-w-full max-h-full object-contain" />
                                            ) : uploading ? (
                                                <Loader size={20} className="text-gray-400 animate-spin" />
                                            ) : (
                                                <span className="text-xs text-gray-400 font-bold">No signature</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
                                                onChange={handleSignatureUpload} className="hidden" />
                                            <button type="button" onClick={() => fileRef.current?.click()}
                                                disabled={uploading || saving}
                                                className="flex items-center gap-1.5 text-xs font-bold uppercase px-3 py-1.5 border-2 border-black bg-blue-500 text-white shadow-brutal-sm hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50">
                                                <Upload size={12} />
                                                {signatureUrl ? 'Replace' : 'Upload'}
                                            </button>
                                            {signatureUrl && (
                                                <button type="button" onClick={() => setSignatureUrl('')}
                                                    disabled={uploading || saving}
                                                    className="flex items-center gap-1 text-xs font-bold uppercase text-red-600 hover:underline">
                                                    <Trash2 size={10} /> Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1">JPEG, PNG, WebP · Max 2MB · Transparent PNG recommended</p>
                                </div>
                            </div>

                            <button onClick={handleSave} disabled={saving || uploading}
                                className={`mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 font-black text-sm uppercase tracking-wider border-2 border-black shadow-brutal transition-all ${saving ? 'bg-gray-200 text-gray-500 cursor-wait' : 'bg-green-500 text-white hover:translate-y-0.5 hover:shadow-none'
                                    }`}>
                                {saving ? <><Loader size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Configuration</>}
                            </button>
                        </div>
                    )}

                    {/* ── User Management Tab ── */}
                    {activeTab === 'users' && <UserManagementPanel />}
                </div>
            </div>
        </div>
    );
};
