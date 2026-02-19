import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Save, CreditCard, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { employeeSchema } from '../../lib/validators';
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

export const EmployeeForm = ({ onSubmit, editingEmployee, onCancel }) => {
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
        reset,
        setValue,
    } = useForm({
        resolver: zodResolver(employeeSchema),
        defaultValues: {
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

    // Auto-set roleType based on designation
    useEffect(() => {
        if (designation && ROLE_TYPE_MAP[designation]) {
            setValue('roleType', ROLE_TYPE_MAP[designation]);
        }
    }, [designation, setValue]);

    // Sync whatsapp with phone if sameAsPhone is checked
    useEffect(() => {
        if (sameAsPhone) {
            setValue('whatsapp', phone);
        }
    }, [sameAsPhone, phone, setValue]);

    // Load editing employee data
    useEffect(() => {
        if (editingEmployee) {
            reset({
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

    const handleFormSubmit = async (data) => {
        // Clean up sameAsPhone before saving
        const { sameAsPhone: _, ...cleanData } = data;
        await onSubmit(cleanData);
        reset();
        toast.success(editingEmployee ? 'Employee updated' : 'Employee added');
    };

    const showLicense = designation === 'driver';
    const showAvailability = designation === 'field_supervisor';

    return (
        <Card className="sticky top-24">
            <h3 className="font-black text-xl mb-6 uppercase flex items-center">
                {editingEmployee ? <Save className="mr-2" /> : <Plus className="mr-2" />}
                {editingEmployee ? 'Update Member' : 'Add New Member'}
            </h3>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                <Input label="Full Name" error={errors.name?.message} {...register('name')} />
                <Input
                    label="Father Name"
                    error={errors.fatherName?.message}
                    {...register('fatherName')}
                />

                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            {...register('sameAsPhone')}
                            className="w-4 h-4 border-2 border-black text-black focus:ring-0"
                        />
                        <label className="text-xs font-bold uppercase">WhatsApp is same as Phone</label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Input
                            label="Phone"
                            placeholder="03001234567"
                            error={errors.phone?.message}
                            {...register('phone')}
                        />
                        <Input
                            label="WhatsApp"
                            placeholder="03001234567"
                            disabled={sameAsPhone}
                            error={errors.whatsapp?.message}
                            {...register('whatsapp')}
                            className={sameAsPhone ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <Select label="Designation" error={errors.designation?.message} {...register('designation')}>
                        {DESIGNATION_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </Select>

                    <div>
                        <label className="block text-xs font-bold uppercase mb-1 text-gray-700">
                            CNIC Number
                        </label>
                        <div className="relative">
                            <CreditCard size={14} className="absolute left-2 top-3 text-gray-400" />
                            <input
                                placeholder="4210112345671"
                                {...register('cnic')}
                                className="w-full border-2 border-black pl-8 p-2 font-mono text-xs focus:outline-none bg-gray-50 focus:bg-white"
                            />
                        </div>
                        {errors.cnic && (
                            <p className="text-xs text-red-600 font-bold mt-1">{errors.cnic.message}</p>
                        )}
                    </div>
                </div>

                {/* Hidden roleType field - auto-set by designation */}
                <input type="hidden" {...register('roleType')} />

                {showLicense && (
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1 text-gray-700">
                            License Number
                        </label>
                        <div className="relative">
                            <FileText size={14} className="absolute left-2 top-3 text-gray-400" />
                            <input
                                placeholder="License No"
                                {...register('licenseNo')}
                                className="w-full border-2 border-black pl-8 p-2 font-mono text-sm focus:outline-none bg-gray-50 focus:bg-white"
                            />
                        </div>
                    </div>
                )}

                {showAvailability && (
                    <div className="bg-gray-50 p-3 border-2 border-dashed border-gray-300">
                        <label className="block text-xs font-bold uppercase mb-2 text-gray-700">
                            Shift Availability
                        </label>
                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    {...register('availability.day')}
                                    className="w-5 h-5 border-2 border-black accent-orange-500"
                                />
                                <span className="text-sm font-bold">☀️ Day</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    {...register('availability.night')}
                                    className="w-5 h-5 border-2 border-black accent-indigo-500"
                                />
                                <span className="text-sm font-bold">🌙 Night</span>
                            </label>
                        </div>
                    </div>
                )}

                <div className="flex items-center space-x-2 py-2">
                    <input
                        type="checkbox"
                        {...register('onLeave')}
                        className="w-5 h-5 border-2 border-black text-red-600 focus:ring-0"
                    />
                    <label className="font-bold text-sm">Currently On Leave</label>
                </div>

                <div className="flex space-x-2 pt-2">
                    <Button
                        type="submit"
                        variant={editingEmployee ? 'primary' : 'success'}
                        className={`flex-1 ${editingEmployee ? 'bg-yellow-400 hover:bg-yellow-500' : ''}`}
                    >
                        {editingEmployee ? <Save size={18} className="mr-2" /> : <Plus size={18} className="mr-2" />}
                        {editingEmployee ? 'Update' : 'Add Member'}
                    </Button>
                    {editingEmployee && (
                        <Button type="button" onClick={onCancel} variant="ghost">
                            Cancel
                        </Button>
                    )}
                </div>
            </form>
        </Card>
    );
};
