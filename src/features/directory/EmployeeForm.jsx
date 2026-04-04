import React, { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Save, FileText, Hash, Camera, X, Loader, Droplet } from 'lucide-react';
import { toast } from 'sonner';
import { employeeSchema } from '../../lib/validators';
import { formatCnic } from '../../utils/formatters';
import { Input, Button, Card } from '../../components/ui';
import { DESIGNATION_OPTIONS, ROLE_TYPE_MAP } from '../../config/designations';
import { PhotoPositionModal } from './PhotoPositionModal';


// Shared field class — consistent on every input regardless of icon/grid position
const fieldClass =
    'w-full border-2 border-black p-2 font-bold focus:outline-none focus:shadow-brutal-sm bg-gray-50 focus:bg-white transition-all';
const errorClass = ' border-red-600 bg-red-50';

export const EmployeeForm = ({ onSubmit, editingEmployee, onCancel, nextEmployeeId }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [photoUrl, setPhotoUrl] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [photoPosition, setPhotoPosition] = useState({ x: 50, y: 50, scale: 1 });
    const [showPositionModal, setShowPositionModal] = useState(false);
    const fileInputRef = useRef(null);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
        reset,
        setValue,
        setError,
        clearErrors,
    } = useForm({
        resolver: zodResolver(employeeSchema),
        defaultValues: {
            employeeId: '',
            name: '',
            fatherName: '',
            designation: 'driver',
            roleType: 'field_team',
            phone: '',
            whatsapp: '',
            cnic: '',
            licenseNo: '',
            bloodGroup: '',
            onLeave: false,
            sameAsPhone: false,
            availability: { day: true, night: false },
        },
    });

    const sameAsPhone = watch('sameAsPhone');
    const phone = watch('phone');
    const designation = watch('designation');

    // Auto-set roleType
    useEffect(() => {
        if (designation && ROLE_TYPE_MAP[designation]) {
            setValue('roleType', ROLE_TYPE_MAP[designation]);
        }
    }, [designation, setValue]);

    // Sync WhatsApp ↔ Phone
    useEffect(() => {
        if (sameAsPhone) setValue('whatsapp', phone);
    }, [sameAsPhone, phone, setValue]);

    // Load editing employee
    useEffect(() => {
        if (editingEmployee) {
            reset({
                employeeId: editingEmployee.employeeId || '',
                name: editingEmployee.name || '',
                fatherName: editingEmployee.fatherName || '',
                designation: editingEmployee.designation || 'driver',
                roleType: editingEmployee.roleType || 'field_team',
                phone: editingEmployee.phone || '',
                whatsapp: editingEmployee.whatsapp || '',
                cnic: editingEmployee.cnic || '',
                licenseNo: editingEmployee.licenseNo || '',
                bloodGroup: editingEmployee.bloodGroup || '',
                onLeave: editingEmployee.onLeave || false,
                sameAsPhone: editingEmployee.phone === editingEmployee.whatsapp,
                availability: editingEmployee.availability || { day: true, night: false },
            });
            setPhotoUrl(editingEmployee.photoUrl || null);
            setPhotoPosition(editingEmployee.photoPosition || { x: 50, y: 50, scale: 1 });
        } else {
            reset({
                employeeId: nextEmployeeId || '',
                name: '',
                fatherName: '',
                designation: 'driver',
                roleType: 'field_team',
                phone: '',
                whatsapp: '',
                cnic: '',
                licenseNo: '',
                bloodGroup: '',
                onLeave: false,
                sameAsPhone: false,
                availability: { day: true, night: false },
            });
            setPhotoUrl(null);
            setPhotoPosition({ x: 50, y: 50, scale: 1 });
            setUploadError(null);
        }
    }, [editingEmployee, nextEmployeeId, reset]);

    // CNIC auto-format handler
    const handleCnicChange = (e) => {
        const formatted = formatCnic(e.target.value);
        setValue('cnic', formatted, { shouldValidate: true });
    };

    const handlePhotoSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadError(null);
        setUploading(true);
        try {
            const { uploadImage } = await import('../../services/cloudinaryService');
            const url = await uploadImage(file);
            setPhotoUrl(url);
            setPhotoPosition({ x: 50, y: 50, scale: 1 });
            setShowPositionModal(true);
            toast.success('Photo uploaded — position it now');
        } catch (err) {
            setUploadError(err.message);
            toast.error(err.message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };


    const handleFormSubmit = async (data) => {
        if (uploading) {
            toast.error('Wait for photo upload to finish');
            return;
        }
        if (uploadError) {
            toast.error('Fix photo upload error before saving');
            return;
        }
        const { sameAsPhone: _, ...cleanData } = data;
        cleanData.photoUrl = photoUrl || null;
        cleanData.photoPosition = photoUrl ? photoPosition : null;
        setIsSubmitting(true);
        try {
            await onSubmit(cleanData);
            reset();
            setPhotoUrl(null);
            toast.success(editingEmployee ? 'Employee updated' : 'Employee added');
        } catch (err) {
            toast.error('Failed to save. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const showLicense = designation === 'driver';
    const showAvailability = designation === 'field_supervisor';
    const cnicValue = watch('cnic');

    return (
        <Card className="w-full">
            <h3 className="font-black text-lg md:text-xl mb-4 md:mb-6 uppercase flex items-center">
                {editingEmployee ? <Save className="mr-2" size={20} /> : <Plus className="mr-2" size={20} />}
                {editingEmployee ? 'Update Member' : 'Add New Member'}
            </h3>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4" noValidate>

                {/* ── Photo + Employee ID row ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="w-full">
                        <label className="text-xs font-bold uppercase mb-1 text-gray-700 flex items-center gap-1">
                            <Camera size={11} />
                            Employee Photo
                        </label>
                        <div className="flex items-start gap-3">
                            {/* Photo preview — static, shows current position */}
                            <div
                                className={`border-2 border-black bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 ${uploading ? 'animate-pulse' : ''}`}
                                style={{
                                    width: 96,
                                    height: 105,
                                    position: 'relative',
                                    borderRadius: 4,
                                }}
                            >
                                {photoUrl ? (
                                    <img
                                        src={photoUrl}
                                        alt="Photo"
                                        draggable={false}
                                        style={{
                                            position: 'absolute',
                                            height: `${(photoPosition.scale || 1) * 100}%`,
                                            width: 'auto',
                                            left: `${photoPosition.x ?? 50}%`,
                                            top: `${photoPosition.y ?? 50}%`,
                                            transform: 'translate(-50%, -50%)',
                                            pointerEvents: 'none',
                                            userSelect: 'none',
                                        }}
                                    />
                                ) : uploading ? (
                                    <Loader size={20} className="text-gray-400 animate-spin" />
                                ) : (
                                    <Camera size={20} className="text-gray-400" />
                                )}
                            </div>
                            {/* Controls */}
                            <div className="flex flex-col gap-1 flex-1">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handlePhotoSelect}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading || isSubmitting}
                                    className="text-xs font-bold uppercase px-3 py-1.5 border-2 border-black bg-blue-500 text-white shadow-brutal-sm hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50"
                                >
                                    {photoUrl ? 'Replace' : 'Upload'}
                                </button>
                                {photoUrl && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setShowPositionModal(true)}
                                            disabled={uploading || isSubmitting}
                                            className="text-xs font-bold uppercase px-3 py-1.5 border-2 border-black bg-gray-800 text-white shadow-brutal-sm hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50"
                                        >
                                            Reposition
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setPhotoUrl(null); setPhotoPosition({ x: 50, y: 50, scale: 1 }); setUploadError(null); }}
                                            disabled={uploading || isSubmitting}
                                            className="text-xs font-bold uppercase px-3 py-1 text-red-600 hover:underline"
                                        >
                                            Remove
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                        {uploadError && (
                            <p className="text-xs text-red-600 font-bold mt-1">{uploadError}</p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-1">JPEG, PNG, WebP · Max 2MB</p>
                    </div>

                    {/* Employee ID - in same grid */}
                    <div className="w-full">
                        <label className="text-xs font-bold uppercase mb-1 text-gray-700 flex items-center gap-1">
                            <Hash size={11} />
                            Employee ID
                        </label>
                        <input
                            placeholder="e.g. EMP-001"
                            {...register('employeeId')}
                            style={{ minHeight: 44 }}
                            className={`${fieldClass}${errors.employeeId ? errorClass : ''} font-mono uppercase tracking-wide`}
                        />
                        {errors.employeeId && (
                            <p className="text-xs text-red-600 font-bold mt-1">{errors.employeeId.message}</p>
                        )}
                    </div>
                </div>

                {/* ── Name / Father Name ── 2-column grid on larger screens */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Full Name"
                        error={errors.name?.message}
                        style={{ minHeight: 44 }}
                        {...register('name')}
                    />
                    <Input
                        label="Father Name"
                        error={errors.fatherName?.message}
                        style={{ minHeight: 44 }}
                        {...register('fatherName')}
                    />
                </div>

                {/* ── Phone / WhatsApp ── */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            {...register('sameAsPhone')}
                            className="w-4 h-4 border-2 border-black"
                        />
                        <span className="text-xs font-bold uppercase">WhatsApp is same as Phone</span>
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Phone */}
                        <div className="w-full">
                            <label className="block text-xs font-bold uppercase mb-1 text-gray-700">Phone</label>
                            <input
                                placeholder="03001234567"
                                maxLength={11}
                                style={{ minHeight: 44 }}
                                {...register('phone')}
                                className={`${fieldClass}${errors.phone ? errorClass : ''}`}
                            />
                            {errors.phone && (
                                <p className="text-xs text-red-600 font-bold mt-1">{errors.phone.message}</p>
                            )}
                        </div>

                        {/* WhatsApp */}
                        <div className="w-full">
                            <label className="block text-xs font-bold uppercase mb-1 text-gray-700">WhatsApp</label>
                            <input
                                placeholder="03001234567"
                                maxLength={11}
                                disabled={sameAsPhone}
                                style={{ minHeight: 44 }}
                                {...register('whatsapp')}
                                className={`${fieldClass}${errors.whatsapp ? errorClass : ''}${sameAsPhone ? ' bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                            />
                            {errors.whatsapp && (
                                <p className="text-xs text-red-600 font-bold mt-1">{errors.whatsapp.message}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Designation / CNIC row ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Designation */}
                    <div className="w-full">
                        <label className="block text-xs font-bold uppercase mb-1 text-gray-700">Designation</label>
                        <select
                            value={designation}
                            onChange={e => setValue('designation', e.target.value, { shouldValidate: true })}
                            style={{ minHeight: 44 }}
                            className={`${fieldClass}${errors.designation ? errorClass : ''}`}
                        >
                            {DESIGNATION_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        {errors.designation && (
                            <p className="text-xs text-red-600 font-bold mt-1">{errors.designation.message}</p>
                        )}
                    </div>

                    {/* CNIC */}
                    <div className="w-full">
                        <label className="block text-xs font-bold uppercase mb-1 text-gray-700">
                            CNIC Number
                        </label>
                        <input
                            placeholder="42101-1234567-1"
                            maxLength={15}
                            value={cnicValue}
                            onChange={handleCnicChange}
                            style={{ minHeight: 44 }}
                            className={`${fieldClass} font-mono${errors.cnic ? errorClass : ''}`}
                        />
                        {errors.cnic && (
                            <p className="text-xs text-red-600 font-bold mt-1">{errors.cnic.message}</p>
                        )}
                    </div>
                </div>

                {/* ── Blood Group ── */}
                <div className="w-full md:w-1/2">
                    <label className="block text-xs font-bold uppercase mb-1 text-gray-700 flex items-center gap-1">
                        <Droplet size={11} />
                        Blood Group
                    </label>
                    <select
                        {...register('bloodGroup')}
                        style={{ minHeight: 44 }}
                        className={`${fieldClass}${errors.bloodGroup ? errorClass : ''}`}
                    >
                        <option value="">Select Blood Group</option>
                        <option value="A+">A+</option>
                        <option value="A-">A−</option>
                        <option value="B+">B+</option>
                        <option value="B-">B−</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB−</option>
                        <option value="O+">O+</option>
                        <option value="O-">O−</option>
                    </select>
                    {errors.bloodGroup && (
                        <p className="text-xs text-red-600 font-bold mt-1">{errors.bloodGroup.message}</p>
                    )}
                </div>

                <input type="hidden" {...register('roleType')} />

                {/* ── License (driver only) ── */}
                {showLicense && (
                    <div className="w-full md:w-1/2">
                        <label className="block text-xs font-bold uppercase mb-1 text-gray-700">License Number</label>
                        <div className="relative">
                            <FileText size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                                placeholder="License No"
                                {...register('licenseNo')}
                                style={{ minHeight: 44 }}
                                className={`${fieldClass} pl-8`}
                            />
                        </div>
                    </div>
                )}

                {/* ── Availability (field_supervisor only) ── */}
                {showAvailability && (
                    <div className="bg-gray-50 p-3 border-2 border-dashed border-gray-300">
                        <label className="block text-xs font-bold uppercase mb-2 text-gray-700">Shift Availability</label>
                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" {...register('availability.day')} className="w-5 h-5 border-2 border-black accent-orange-500" />
                                <span className="text-sm font-bold">☀️ Day</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" {...register('availability.night')} className="w-5 h-5 border-2 border-black accent-indigo-500" />
                                <span className="text-sm font-bold">🌙 Night</span>
                            </label>
                        </div>
                    </div>
                )}

                {/* ── On Leave ── */}
                <label className="flex items-center gap-2 cursor-pointer py-2">
                    <input
                        type="checkbox"
                        {...register('onLeave')}
                        className="w-5 h-5 border-2 border-black text-red-600 focus:ring-0"
                    />
                    <span className="font-bold text-sm">Currently On Leave</span>
                </label>

                {/* ── Submit button ── */}
                <div className="flex gap-2 pt-2">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                            flex: 1,
                            minHeight: 48,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            fontWeight: 900,
                            fontSize: 14,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            border: '2px solid #000',
                            borderRadius: 2,
                            boxShadow: isSubmitting ? 'none' : '3px 3px 0 #000',
                            background: editingEmployee ? '#FACC15' : '#22c55e',
                            color: '#111827',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            opacity: isSubmitting ? 0.7 : 1,
                            transition: 'box-shadow 150ms, opacity 150ms',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {isSubmitting ? (
                            '…Saving'
                        ) : editingEmployee ? (
                            <><Save size={16} /><span>Update Member</span></>
                        ) : (
                            <><Plus size={16} /><span>Add Member</span></>
                        )}
                    </button>

                    {editingEmployee && (
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isSubmitting}
                            style={{
                                minHeight: 48,
                                padding: '0 16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: 13,
                                border: '2px solid #000',
                                borderRadius: 2,
                                background: '#fff',
                                cursor: 'pointer',
                            }}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>
            {showPositionModal && photoUrl && (
                <PhotoPositionModal
                    imageUrl={photoUrl}
                    initialPosition={photoPosition}
                    onSave={(pos) => {
                        setPhotoPosition(pos);
                        setShowPositionModal(false);
                    }}
                    onCancel={() => setShowPositionModal(false)}
                />
            )}
        </Card>
    );
};
