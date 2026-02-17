import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Save, Camera, CheckCircle, CreditCard, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { employeeSchema } from '../../lib/validators';
import { Input, Select, Button, Card } from '../../components/ui';

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
            role: 'Driver',
            phone: '',
            whatsapp: '',
            cnic: '',
            license: '',
            onLeave: false,
            sameAsPhone: false,
        },
    });

    const sameAsPhone = watch('sameAsPhone');
    const phone = watch('phone');

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
                ...editingEmployee,
                sameAsPhone: editingEmployee.phone === editingEmployee.whatsapp,
            });
        } else {
            reset({
                name: '',
                fatherName: '',
                role: 'Driver',
                phone: '',
                whatsapp: '',
                cnic: '',
                license: '',
                onLeave: false,
                sameAsPhone: false,
            });
        }
    }, [editingEmployee, reset]);

    const handleFormSubmit = async (data) => {
        await onSubmit(data);
        reset();
        toast.success(editingEmployee ? 'Employee updated' : 'Employee added');
    };

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
                            placeholder="0300-1234567"
                            error={errors.phone?.message}
                            {...register('phone')}
                        />
                        <Input
                            label="WhatsApp"
                            placeholder="0300-1234567"
                            disabled={sameAsPhone}
                            error={errors.whatsapp?.message}
                            {...register('whatsapp')}
                            className={sameAsPhone ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <Select label="Role" error={errors.role?.message} {...register('role')}>
                        <option value="Driver">Driver</option>
                        <option value="Supervisor">Supervisor</option>
                        <option value="Helper">Helper</option>
                        <option value="Hotline">Hotline</option>
                    </Select>

                    <div>
                        <label className="block text-xs font-bold uppercase mb-1 text-gray-700">
                            CNIC Number
                        </label>
                        <div className="relative">
                            <CreditCard size={14} className="absolute left-2 top-3 text-gray-400" />
                            <input
                                placeholder="42101-1234567-1"
                                {...register('cnic')}
                                className="w-full border-2 border-black pl-8 p-2 font-mono text-xs focus:outline-none bg-gray-50 focus:bg-white"
                            />
                        </div>
                        {errors.cnic && (
                            <p className="text-xs text-red-600 font-bold mt-1">{errors.cnic.message}</p>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase mb-1 text-gray-700">
                        License Number
                    </label>
                    <div className="relative">
                        <FileText size={14} className="absolute left-2 top-3 text-gray-400" />
                        <input
                            placeholder="License No (if Driver)"
                            {...register('license')}
                            className="w-full border-2 border-black pl-8 p-2 font-mono text-sm focus:outline-none bg-gray-50 focus:bg-white"
                        />
                    </div>
                </div>

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
