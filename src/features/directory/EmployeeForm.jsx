import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Save, FileText, Hash } from 'lucide-react';
import { toast } from 'sonner';
import { employeeSchema } from '../../lib/validators';
import { formatCnic } from '../../utils/formatters';
import { Input, Select, Button, Card } from '../../components/ui';

const DESIGNATION_OPTIONS = [
    { value: 'driver', label: 'Driver' },
    { value: 'supervisor', label: 'Vehicle Supervisor' },
    { value: 'helper', label: 'Helper' },
    { value: 'field_supervisor', label: 'Field Supervisor' },
    { value: 'executive_officer', label: 'Executive Officer (Hotline)' },
];

const ROLE_TYPE_MAP = {
    driver: 'field_team',
    supervisor: 'field_team',
    helper: 'field_team',
    field_supervisor: 'field_supervisor',
    executive_officer: 'executive',
};


// Shared field class — consistent on every input regardless of icon/grid position
const fieldClass =
    'w-full border-2 border-black p-2 font-bold focus:outline-none focus:shadow-brutal-sm bg-gray-50 focus:bg-white transition-all';
const errorClass = ' border-red-600 bg-red-50';

export const EmployeeForm = ({ onSubmit, editingEmployee, onCancel }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

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
                onLeave: editingEmployee.onLeave || false,
                sameAsPhone: editingEmployee.phone === editingEmployee.whatsapp,
                availability: editingEmployee.availability || { day: true, night: false },
            });
        } else {
            reset({
                employeeId: '',
                name: '',
                fatherName: '',
                designation: 'driver',
                roleType: 'field_team',
                phone: '',
                whatsapp: '',
                cnic: '',
                licenseNo: '',
                onLeave: false,
                sameAsPhone: false,
                availability: { day: true, night: false },
            });
        }
    }, [editingEmployee, reset]);

    // CNIC auto-format handler
    const handleCnicChange = (e) => {
        const formatted = formatCnic(e.target.value);
        setValue('cnic', formatted, { shouldValidate: true });
    };

    const handleFormSubmit = async (data) => {
        const { sameAsPhone: _, ...cleanData } = data;
        setIsSubmitting(true);
        try {
            await onSubmit(cleanData);
            reset();
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
        <Card className="sticky top-24">
            <h3 className="font-black text-xl mb-6 uppercase flex items-center">
                {editingEmployee ? <Save className="mr-2" /> : <Plus className="mr-2" />}
                {editingEmployee ? 'Update Member' : 'Add New Member'}
            </h3>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4" noValidate>

                {/* ── Employee ID ── */}
                <div className="w-full">
                    <label className="block text-xs font-bold uppercase mb-1 text-gray-700 flex items-center gap-1">
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

                {/* ── Name / Father Name ── */}
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

                    <div className="grid grid-cols-2 gap-2">
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

                {/* ── Designation ── */}
                <Select
                    label="Designation"
                    error={errors.designation?.message}
                    {...register('designation')}
                />

                {/* ── CNIC ── full-width, same styling ── */}
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

                <input type="hidden" {...register('roleType')} />

                {/* ── License (driver only) ── */}
                {showLicense && (
                    <div className="w-full">
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
        </Card>
    );
};
