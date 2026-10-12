"use client";

import React, { useEffect } from 'react';
import { Modal, Input, Button, message as antdMessage } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateCustomer, useUpdateCustomer } from '../hooks';

interface CustomerModalProps {
  open: boolean;
  onClose: () => void;
  customer?: any;
}

const customerSchema = z.object({
  name: z.string().min(1, 'Họ tên bắt buộc'),
  email: z.string().email('Email không đúng định dạng'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Số điện thoại phải có 10 chữ số').optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'DEACTIVE', 'INACTIVE']).optional(),
});

export const CustomerModal = ({ open, onClose, customer }: CustomerModalProps) => {
  const { mutate: createCustomer, isPending: isCreating } = useCreateCustomer();
  const { mutate: updateCustomer, isPending: isUpdating } = useUpdateCustomer();
  const [messageApi, contextHolder] = antdMessage.useMessage();

  const { control, handleSubmit, reset, setError, formState: { errors } } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: '', email: '', phone: '', status: 'ACTIVE' }
  });

  useEffect(() => {
    if (open) {
      if (customer) {
        const currentStatus =
          customer.status === 'INACTIVE' || customer.status === 'DEACTIVE'
            ? 'DEACTIVE'
            : 'ACTIVE';
        reset({
          name: customer.name,
          email: customer.email,
          phone: customer.phone || '',
          status: currentStatus,
        });
      } else {
        reset({ name: '', email: '', phone: '', status: 'ACTIVE' });
      }
    }
  }, [open, customer, reset]);

  const onSubmit = (values: any) => {
    const payload = { ...values };
    
    const handleApiError = (err: any) => {
      // Backend Validation Errors (400 Bad Request)
      if (err?.response?.data?.data && typeof err.response.data.data === 'object') {
        const fieldErrors = err.response.data.data;
        if (fieldErrors.email) {
          setError('email', { type: 'manual', message: fieldErrors.email });
        }
        if (fieldErrors.name) {
          setError('name', { type: 'manual', message: fieldErrors.name });
        }
        if (fieldErrors.phone) {
          setError('phone', { type: 'manual', message: fieldErrors.phone });
        }
      } 
      // Backend Conflict or generic errors
      else if (err?.response?.data?.message) {
        if (err.response.data.message.toLowerCase().includes('email')) {
          setError('email', { type: 'manual', message: err.response.data.message });
        } else {
          messageApi.error(err.response.data.message);
        }
      } else {
        messageApi.error('Có lỗi xảy ra');
      }
    };

    if (customer) {
      // Backend enum là ACTIVE / INACTIVE, map DEACTIVE -> INACTIVE để backend hiểu chuẩn xác
      const backendStatus =
        payload.status === 'DEACTIVE' || payload.status === 'INACTIVE'
          ? 'INACTIVE'
          : 'ACTIVE';

      updateCustomer(
        { id: customer.id, data: { ...payload, status: backendStatus } },
        {
          onSuccess: () => {
            messageApi.success('Cập nhật thành công');
            onClose();
          },
          onError: handleApiError
        }
      );
    } else {
      createCustomer(payload, {
        onSuccess: () => {
          messageApi.success('Thêm mới thành công');
          onClose();
        },
        onError: handleApiError
      });
    }
  };

  return (
    <>
      {contextHolder}
      <Modal
        title={<span style={{ fontSize: 20 }}>{customer ? 'Sửa Khách Hàng' : 'Thêm Khách Hàng'}</span>}
        open={open}
        width={500}
        onCancel={onClose}
        footer={[
          <Button key="cancel" size="large" onClick={onClose}>Huỷ</Button>,
          <Button key="submit" type="primary" size="large" onClick={handleSubmit(onSubmit)} loading={isCreating || isUpdating}>Lưu</Button>
        ]}
      >
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 16, fontWeight: 500 }}>
              Họ tên <span style={{ color: 'red' }}>*</span>
            </label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input {...field} size="large" status={errors.name ? 'error' : ''} placeholder="Nhập họ tên" />
              )}
            />
            {errors.name && <div style={{ color: 'red', fontSize: 14, marginTop: 4 }}>{String(errors.name.message)}</div>}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 16, fontWeight: 500 }}>
              Email <span style={{ color: 'red' }}>*</span>
            </label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input {...field} size="large" status={errors.email ? 'error' : ''} placeholder="Nhập email" />
              )}
            />
            {errors.email && <div style={{ color: 'red', fontSize: 14, marginTop: 4 }}>{String(errors.email.message)}</div>}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 16, fontWeight: 500 }}>Số điện thoại</label>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <Input {...field} size="large" status={errors.phone ? 'error' : ''} placeholder="Nhập số điện thoại" />
              )}
            />
            {errors.phone && <div style={{ color: 'red', fontSize: 14, marginTop: 4 }}>{String(errors.phone.message)}</div>}
          </div>

          {/* Chọn trạng thái (chỉ hiện khi sửa khách hàng) */}
          {customer && (
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 16, fontWeight: 500 }}>
                Trạng thái
              </label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    style={{
                      width: '100%',
                      height: 40,
                      padding: '0 12px',
                      borderRadius: 8,
                      border: '1px solid #d9d9d9',
                      fontSize: 15,
                      background: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="DEACTIVE">DEACTIVE</option>
                  </select>
                )}
              />
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};
