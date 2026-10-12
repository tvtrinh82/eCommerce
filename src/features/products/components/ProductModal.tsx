"use client";

import React, { useEffect, useState } from 'react';
import { Modal, Input, InputNumber, Select, Button, message as antdMessage, Upload } from 'antd';
import { UploadOutlined, LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateProduct, useUpdateProduct } from '../hooks';
import { Product, ProductPayload } from '../types';
import { apiClient } from '@/lib/api-client';

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  product?: Product;
}

const productSchema = z.object({
  name: z.string().min(1, 'Tên bắt buộc'),
  status: z.enum(['ACTIVE', 'DEACTIVE']),
  price: z.number().min(1, 'Giá phải > 0'),
  stock: z.number().int('Tồn kho là số nguyên').min(0, 'Tồn kho >= 0'),
  imageUrl: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export const ProductModal = ({ open, onClose, product }: ProductModalProps) => {
  const { mutate: createProduct, isPending: isCreating } = useCreateProduct();
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct();
  const [uploading, setUploading] = useState(false);

  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      status: 'ACTIVE',
      price: 0,
      stock: 0,
      imageUrl: '',
    }
  });

  const imageUrl = watch('imageUrl');
  const [messageApi, contextHolder] = antdMessage.useMessage();

  useEffect(() => {
    if (open) {
      if (product) {
        reset({
          name: product.name,
          status: (product.status as any) || 'ACTIVE',
          price: product.price,
          stock: product.stock,
          imageUrl: product.imageUrl || '',
        });
      } else {
        reset({ name: '', status: 'ACTIVE', price: 0, stock: 0, imageUrl: '' });
      }
    }
  }, [open, product, reset]);

  const customUploadRequest = async (options: any) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const response: any = await apiClient.post('/products/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const url = response.data.imageUrl;
      setValue('imageUrl', url, { shouldValidate: true, shouldDirty: true });
      onSuccess("ok");
      messageApi.success('Tải ảnh lên thành công');
    } catch (err: any) {
      onError(err);
      messageApi.error('Tải ảnh lên thất bại');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (values: ProductFormValues) => {
    const payload: any = {
      name: values.name,
      price: values.price,
      stock: values.stock,
      imageUrl: values.imageUrl,
    };

    if (product) {
      updateProduct(
        { id: product.id, data: { ...payload, status: values.status } },
        {
          onSuccess: () => {
            messageApi.success('Cập nhật sản phẩm thành công');
            onClose();
          },
          onError: (err: any) => {
            const errorMsg = err?.response?.data?.message;
            if (err?.response?.data?.code === 'CONFLICT') {
              messageApi.error('Tên sản phẩm này đã tồn tại, vui lòng chọn tên khác.');
            } else {
              messageApi.error(errorMsg || 'Có lỗi xảy ra khi cập nhật');
            }
          }
        }
      );
    } else {
      createProduct(payload, {
        onSuccess: () => {
          messageApi.success('Thêm sản phẩm thành công');
          onClose();
        },
        onError: (err: any) => {
          const errorMsg = err?.response?.data?.message;
          if (err?.response?.data?.code === 'CONFLICT') {
            messageApi.error('Tên sản phẩm này đã tồn tại, vui lòng chọn tên khác.');
          } else {
            messageApi.error(errorMsg || 'Có lỗi xảy ra khi thêm mới');
          }
        }
      });
    }
  };

  const uploadButton = (
    <div>
      {uploading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Tải ảnh</div>
    </div>
  );

  return (
    <>
      {contextHolder}
      <Modal
      title={<span style={{ fontSize: 20 }}>{product ? 'Thêm / Sửa sản phẩm' : 'Thêm / Sửa sản phẩm'}</span>}
      open={open}
      width={700}
      onCancel={onClose}
      footer={[
        <Button key="cancel" size="large" onClick={onClose}>
          Huỷ
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          size="large"
          onClick={handleSubmit(onSubmit)}
          loading={isCreating || isUpdating}
        >
          Lưu
        </Button>
      ]}
    >
      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', gap: 24 }}>
          {/* Cột trái: Form thông tin */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 16, fontWeight: 500 }}>Tên sản phẩm <span style={{ color: 'red' }}>*</span></label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input {...field} size="large" status={errors.name ? 'error' : ''} placeholder="Tên sản phẩm" />
                )}
              />
              {errors.name && <div style={{ color: 'red', fontSize: 14, marginTop: 4 }}>{errors.name.message}</div>}
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 16, fontWeight: 500 }}>Giá (đ) <span style={{ color: 'red' }}>*</span></label>
                <Controller
                  name="price"
                  control={control}
                  render={({ field }) => (
                    <InputNumber 
                      {...field}
                      size="large"
                      status={errors.price ? 'error' : ''}
                      style={{ width: '100%' }} 
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(value) => value ? Number(value.replace(/\$\s?|(,*)/g, '')) : 0}
                    />
                  )}
                />
                {errors.price && <div style={{ color: 'red', fontSize: 14, marginTop: 4 }}>{errors.price.message}</div>}
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 16, fontWeight: 500 }}>Tồn kho <span style={{ color: 'red' }}>*</span></label>
                <Controller
                  name="stock"
                  control={control}
                  render={({ field }) => (
                    <InputNumber 
                      {...field} 
                      size="large"
                      status={errors.stock ? 'error' : ''}
                      style={{ width: '100%' }} 
                      precision={0} 
                    />
                  )}
                />
                {errors.stock && <div style={{ color: 'red', fontSize: 14, marginTop: 4 }}>{errors.stock.message}</div>}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 16, fontWeight: 500 }}>Trạng thái</label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select {...field} size="large" style={{ width: '100%' }}>
                    <Select.Option value="ACTIVE">ACTIVE</Select.Option>
                    <Select.Option value="DEACTIVE">DEACTIVE</Select.Option>
                  </Select>
                )}
              />
            </div>

          </div>

          {/* Cột phải: Upload ảnh */}
          <div style={{ width: 200, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 16, fontWeight: 500 }}>Ảnh sản phẩm</label>
            <Upload
              name="file"
              listType="picture-card"
              className="avatar-uploader"
              showUploadList={false}
              customRequest={customUploadRequest}
              accept="image/*"
            >
              {imageUrl ? (
                <img src={imageUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                uploadButton
              )}
            </Upload>
            <div style={{ fontSize: 12, color: '#8c8c8c', textAlign: 'center', marginTop: 8 }}>
              Hỗ trợ định dạng JPG, PNG. Tối đa 5MB.
            </div>
          </div>
        </div>
      </div>
    </Modal>
    </>
  );
};
