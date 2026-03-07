/**
 * AuthorityConfigPanel.jsx — Authority Configuration Panel
 *
 * Allows Super Admin to configure:
 *   - Authority name (e.g., Managing Director)
 *   - Signature image for ID cards
 */
import React, { useState, useEffect, useRef } from 'react';
import { Upload, Save, Loader, Image, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { authorityService } from '../../services/firebaseService';
import { useAuth } from '../../hooks/useAuth';

export const AuthorityConfigPanel = () => {
    const { user } = useAuth();
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
            const { uploadSignature } = await import('../../services/cloudinaryService');
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
            <div className="flex items-center justify-center py-12">
                <Loader className="animate-spin text-gray-400" size={24} />
            </div>
        );
    }

    return (
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
    );
};
