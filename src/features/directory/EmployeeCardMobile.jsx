/**
 * EmployeeCardMobile.jsx
 * Mobile-only employee card with inline edit.
 *
 * Compliance:
 *  - No Firestore imports
 *  - No duplicate validation logic — uses central validators
 *  - Validation guards save (toast + early return)
 *  - All buttons disabled={saving}
 *  - onDelete passes employeeId for audit log
 *  - onUpdate is the Context's updateEmployee (service-layer backed)
 */
import React, { useState, useCallback, memo } from 'react';
import { Edit, Trash2, User, Phone, MessageCircle, X, Save } from 'lucide-react';
import { toast } from 'sonner';
import { validateEmployee } from '../../utils/validateEmployee';
import { formatCnic } from '../../utils/formatters';
import { DESIGNATION_OPTIONS } from '../../config/designations';


export const EmployeeCardMobile = memo(({ emp, onDelete, onUpdate, onToggleLeave }) => {
    const roleName = (emp.designation || 'unknown').replace(/_/g, ' ');

    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [draft, setDraft] = useState({});

    const openEdit = useCallback(() => {
        setDraft({
            employeeId: emp.employeeId || '',
            name: emp.name || '',
            phone: emp.phone || '',
            whatsapp: emp.whatsapp || '',
            cnic: emp.cnic || '',
            fatherName: emp.fatherName || '',
            designation: emp.designation || 'driver',
            onLeave: emp.onLeave || false,
        });
        setIsEditing(true);
    }, [emp]);

    const cancelEdit = useCallback(() => {
        setIsEditing(false);
        setDraft({});
    }, []);

    const handleChange = useCallback((field, value) => {
        setDraft(prev => ({ ...prev, [field]: value }));
    }, []);

    const copyPhoneToWhatsApp = useCallback(() => {
        setDraft(prev => ({ ...prev, whatsapp: prev.phone }));
    }, []);

    const handleSave = useCallback(async () => {
        // Central validation — no inline regex here
        const { valid, errors } = validateEmployee(draft);
        if (!valid) {
            const firstError = Object.values(errors)[0];
            toast.error(firstError);
            return;
        }
        setSaving(true);
        try {
            await onUpdate(emp.id, draft);
            setIsEditing(false);
            toast.success('Employee updated');
        } catch {
            toast.error('Failed to save. Try again.');
        } finally {
            setSaving(false);
        }
    }, [draft, emp.id, onUpdate]);

    const handleToggleLeave = useCallback(async () => {
        // Use dedicated toggleLeave action from context (proper audit log + serverTimestamp)
        try {
            await onToggleLeave(emp.id, emp.onLeave, emp.employeeId);
        } catch {
            toast.error('Failed to update leave status.');
        }
    }, [emp.id, emp.onLeave, emp.employeeId, onToggleLeave]);

    const handleDelete = useCallback(() => {
        if (window.confirm('Remove this employee from all duties?')) {
            onDelete(emp.id, emp.employeeId);
        }
    }, [emp.id, emp.employeeId, onDelete]);

    return (
        <div style={s.card}>
            {/* ── TOP ROW ─────────────────────────── */}
            <div style={s.topRow}>
                <div style={s.avatarWrap}>
                    {emp.photo
                        ? <img src={emp.photo} alt="avatar" style={s.avatarImg} />
                        : <User size={22} color="#9ca3af" />
                    }
                </div>
                <div style={s.nameBlock}>
                    <span style={s.empName}>{emp.name}</span>
                    <span style={s.roleBadge}>{roleName}</span>
                </div>
                <button
                    onClick={handleToggleLeave}
                    title="Tap to toggle leave"
                    disabled={saving}
                    style={{
                        ...s.statusBadge,
                        background: emp.onLeave ? '#fee2e2' : '#dcfce7',
                        color: emp.onLeave ? '#b91c1c' : '#15803d',
                        border: emp.onLeave ? '1px solid #fca5a5' : '1px solid #86efac',
                    }}
                >
                    {emp.onLeave ? 'On Leave' : 'Active'}
                </button>
            </div>

            {/* ── MIDDLE INFO ──────────────────────── */}
            <div style={s.middleSection}>
                <InfoRow label="ID" value={emp.employeeId || '—'} />
                <InfoRow label="CNIC" value={emp.cnic || '—'} />
                <div style={s.infoRow}>
                    <Phone size={12} style={{ marginRight: 4, color: '#3b82f6', flexShrink: 0 }} />
                    <span style={s.infoValue}>{emp.phone || '—'}</span>
                    {emp.whatsapp && emp.whatsapp !== emp.phone && (
                        <>
                            <MessageCircle size={12} style={{ marginLeft: 10, marginRight: 4, color: '#16a34a', flexShrink: 0 }} />
                            <span style={s.infoValue}>{emp.whatsapp}</span>
                        </>
                    )}
                </div>
            </div>

            {/* ── ACTION BUTTONS ───────────────────── */}
            <div style={s.actionRow}>
                <button onClick={openEdit} style={s.editBtn} disabled={saving}>
                    <Edit size={14} style={{ marginRight: 5 }} />
                    {isEditing ? 'Editing…' : 'Edit'}
                </button>
                <button onClick={handleDelete} style={s.deleteBtn} disabled={saving}>
                    <Trash2 size={14} style={{ marginRight: 5 }} />
                    Delete
                </button>
            </div>

            {/* ── INLINE EDIT PANEL ────────────────── */}
            <div style={{
                overflow: 'hidden',
                maxHeight: isEditing ? '1000px' : 0,
                transition: 'max-height 320ms ease-in-out',
            }}>
                <div style={s.editPanel}>
                    {/* Header */}
                    <div style={s.editPanelHeader}>
                        <span style={s.editPanelTitle}>✏ Edit Employee</span>
                        {saving && <span style={s.savingBadge}>Saving…</span>}
                        <button onClick={cancelEdit} style={s.closeBtn} disabled={saving}>
                            <X size={14} />
                        </button>
                    </div>

                    {/* Employee ID */}
                    <EditField
                        label="Employee ID"
                        value={draft.employeeId || ''}
                        onChange={v => handleChange('employeeId', v.toUpperCase())}
                        mono
                    />

                    {/* Full Name */}
                    <EditField label="Full Name" value={draft.name || ''} onChange={v => handleChange('name', v)} />

                    {/* Father Name */}
                    <EditField label="Father Name" value={draft.fatherName || ''} onChange={v => handleChange('fatherName', v)} />

                    {/* Phone */}
                    <div style={s.fieldWrap}>
                        <label style={s.fieldLabel}>Phone</label>
                        <input
                            value={draft.phone || ''}
                            onChange={e => handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, 11))}
                            style={{ ...s.fieldInput, fontFamily: 'monospace' }}
                            maxLength={11}
                            placeholder="03001234567"
                        />
                    </div>

                    {/* WhatsApp + copy button */}
                    <div style={s.fieldWrap}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                            <label style={s.fieldLabel}>WhatsApp</label>
                            <button
                                type="button"
                                onClick={copyPhoneToWhatsApp}
                                style={s.copyBtn}
                                title="Copy phone number to WhatsApp"
                            >
                                📋 Use Phone Number
                            </button>
                        </div>
                        <input
                            value={draft.whatsapp || ''}
                            onChange={e => handleChange('whatsapp', e.target.value.replace(/\D/g, '').slice(0, 11))}
                            style={{ ...s.fieldInput, fontFamily: 'monospace' }}
                            maxLength={11}
                            placeholder="03001234567"
                        />
                    </div>

                    {/* CNIC — auto-format via central formatter */}
                    <div style={s.fieldWrap}>
                        <label style={s.fieldLabel}>CNIC</label>
                        <input
                            value={draft.cnic || ''}
                            onChange={e => handleChange('cnic', formatCnic(e.target.value))}
                            style={{ ...s.fieldInput, fontFamily: 'monospace' }}
                            maxLength={15}
                            placeholder="42101-1234567-1"
                        />
                    </div>

                    {/* Designation */}
                    <div style={s.fieldWrap}>
                        <label style={s.fieldLabel}>Designation</label>
                        <select
                            value={draft.designation || 'driver'}
                            onChange={e => handleChange('designation', e.target.value)}
                            style={{ ...s.fieldInput, paddingRight: 28 }}
                        >
                            {DESIGNATION_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* On Leave */}
                    <label style={s.checkRow}>
                        <input
                            type="checkbox"
                            checked={draft.onLeave || false}
                            onChange={e => handleChange('onLeave', e.target.checked)}
                            style={{ width: 16, height: 16, accentColor: '#ef4444' }}
                        />
                        <span style={s.checkLabel}>Currently On Leave</span>
                    </label>

                    {/* Save / Cancel */}
                    <div style={{ ...s.actionRow, marginTop: 4 }}>
                        <button onClick={handleSave} style={s.saveBtn} disabled={saving}>
                            <Save size={14} style={{ marginRight: 5 }} />
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                        <button onClick={cancelEdit} style={s.cancelBtn} disabled={saving}>
                            <X size={14} style={{ marginRight: 5 }} />
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});

EmployeeCardMobile.displayName = 'EmployeeCardMobile';

/* ─── Sub-components ─── */
const InfoRow = ({ label, value }) => (
    <div style={s.infoRow}>
        <span style={s.infoLabel}>{label}</span>
        <span style={s.infoValue}>{value}</span>
    </div>
);

const EditField = ({ label, value, onChange, mono }) => (
    <div style={s.fieldWrap}>
        <label style={s.fieldLabel}>{label}</label>
        <input
            value={value}
            onChange={e => onChange(e.target.value)}
            style={{ ...s.fieldInput, fontFamily: mono ? 'monospace' : 'inherit' }}
        />
    </div>
);

/* ─── Styles (centralized — no inline style blocks in JSX above) ─── */
const s = {
    card: {
        background: '#fff',
        border: '2px solid #000',
        boxShadow: '3px 3px 0 #000',
        padding: 16,
        marginBottom: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
    },
    topRow: { display: 'flex', alignItems: 'center', gap: 10 },
    avatarWrap: {
        width: 44, height: 44, borderRadius: '50%',
        background: '#f3f4f6', border: '2px solid #000',
        overflow: 'hidden', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
    nameBlock: { display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 0 },
    empName: {
        fontWeight: 800, fontSize: 13, color: '#111827', textTransform: 'uppercase',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    },
    roleBadge: {
        display: 'inline-block', fontSize: 10, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.04em',
        background: '#f3f4f6', color: '#374151',
        border: '1px solid #d1d5db', borderRadius: 2,
        padding: '1px 5px', alignSelf: 'flex-start',
    },
    statusBadge: {
        fontSize: 10, fontWeight: 700, borderRadius: 4,
        padding: '3px 8px', textTransform: 'uppercase',
        letterSpacing: '0.04em', flexShrink: 0, cursor: 'pointer',
    },
    middleSection: {
        borderTop: '2px solid #000', paddingTop: 10,
        display: 'flex', flexDirection: 'column', gap: 6,
    },
    infoRow: { display: 'flex', alignItems: 'center', fontSize: 12, fontFamily: 'monospace' },
    infoLabel: { fontWeight: 700, color: '#6b7280', width: 48, flexShrink: 0, fontSize: 10, textTransform: 'uppercase' },
    infoValue: { color: '#111827', fontWeight: 600 },
    actionRow: { display: 'flex', gap: 10 },
    editBtn: {
        flex: 1, minHeight: 44,
        background: '#FACC15', color: '#1a1a1a', fontWeight: 700, fontSize: 13,
        border: '2px solid #000', borderRadius: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    },
    deleteBtn: {
        flex: 1, minHeight: 44,
        background: '#EF4444', color: '#fff', fontWeight: 700, fontSize: 13,
        border: '2px solid #000', borderRadius: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    },
    editPanel: {
        borderTop: '2px dashed #000', paddingTop: 12,
        display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4,
    },
    editPanelHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 },
    editPanelTitle: { fontWeight: 800, fontSize: 12, textTransform: 'uppercase', flex: 1 },
    savingBadge: {
        fontSize: 10, fontWeight: 700, background: '#fef9c3',
        border: '1px solid #fbbf24', borderRadius: 2, padding: '1px 6px',
    },
    closeBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' },
    fieldWrap: { display: 'flex', flexDirection: 'column', gap: 3 },
    fieldLabel: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#6b7280' },
    fieldInput: {
        width: '100%', height: 40,
        border: '2px solid #000', borderRadius: 2,
        padding: '0 10px', fontSize: 13, fontWeight: 600,
        background: '#f9fafb', boxSizing: 'border-box',
        fontFamily: 'inherit', outline: 'none',
    },
    copyBtn: {
        fontSize: 10, fontWeight: 700,
        background: '#fff', color: '#111827',
        border: '2px solid #000', borderRadius: 2,
        padding: '2px 8px', cursor: 'pointer',
        letterSpacing: '0.02em',
    },
    checkRow: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' },
    checkLabel: { fontSize: 12, fontWeight: 700 },
    saveBtn: {
        flex: 1, minHeight: 44,
        background: '#111827', color: '#fff', fontWeight: 700, fontSize: 13,
        border: '2px solid #000', borderRadius: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    },
    cancelBtn: {
        flex: 1, minHeight: 44,
        background: '#fff', color: '#111827', fontWeight: 700, fontSize: 13,
        border: '2px solid #000', borderRadius: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    },
};
