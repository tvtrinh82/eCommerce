"use client";

import React, { useState, useEffect } from "react";
import {
  DatePicker,
  InputNumber,
  Input,
  Select,
  Radio,
  Button,
  Form,
  App,
} from "antd";
import dayjs from "dayjs";
import { apiClient } from "@/lib/api-client";

// Metadata tham số cấu hình động từ BE
export interface ReportParamMeta {
  name: string;
  label: string;
  type: "DATE" | "INTEGER" | "DECIMAL" | "STRING" | "SELECT";
  required: boolean;
  defaultValue?: any;
  options?: { label: string; value: any }[];
}

// Cấu hình chuẩn mặc định theo đặc tả đề bài (khi BE chưa có endpoint meta)
const DEFAULT_FALLBACK_PARAMS: ReportParamMeta[] = [
  {
    name: "fromDate",
    label: "Từ ngày",
    type: "DATE",
    required: true,
    defaultValue: "2026-10-01",
  },
  {
    name: "toDate",
    label: "Đến ngày",
    type: "DATE",
    required: true,
    defaultValue: "2026-10-04",
  },
  {
    name: "customerId",
    label: "Khách hàng",
    type: "SELECT",
    required: false,
    defaultValue: "ALL",
    options: [{ label: "Tất cả", value: "ALL" }],
  },
];

export default function ReportsExportPage() {
  const { message } = App.useApp();
  const [paramsConfig, setParamsConfig] = useState<ReportParamMeta[]>(DEFAULT_FALLBACK_PARAMS);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [format, setFormat] = useState<"PDF" | "XLSX">("PDF");
  const [form] = Form.useForm();

  // 1. Tải metadata tham số động từ Backend & danh sách Khách hàng
  useEffect(() => {
    const initData = async () => {
      let finalParams = [...DEFAULT_FALLBACK_PARAMS];

      // a. Cố gắng lấy danh sách tham số động nếu BE cung cấp endpoint
      try {
        const metaRes: any = await apiClient.get("/admin/reports/revenue/params");
        const list = metaRes?.data || metaRes;
        if (Array.isArray(list) && list.length > 0) {
          finalParams = list;
        }
      } catch (err) {
        // Nếu BE chưa hỗ trợ API metadata động, tiếp tục dùng cấu hình mặc định
      }

      // b. Tải danh sách khách hàng thật từ BE để đổ vào dropdown "Khách hàng"
      try {
        const custRes: any = await apiClient.get("/admin/customers?page=0&size=100");
        const customers = custRes?.data?.content || custRes?.data || custRes || [];
        if (Array.isArray(customers) && customers.length > 0) {
          const custOptions = [
            { label: "Tất cả", value: "ALL" },
            ...customers.map((c: any) => ({
              label: c.name || c.fullName || c.email || `Khách hàng #${c.id}`,
              value: c.id,
            })),
          ];

          finalParams = finalParams.map((p) => {
            if (p.name === "customerId" || p.name === "customer") {
              return { ...p, options: custOptions };
            }
            return p;
          });
        }
      } catch (err) {
        // Bỏ qua lỗi danh sách khách hàng, giữ nguyên option "Tất cả"
      }

      setParamsConfig(finalParams);

      // Điền giá trị mặc định ban đầu
      const initialFormValues: Record<string, any> = {};
      finalParams.forEach((p) => {
        if (p.defaultValue !== undefined && p.defaultValue !== null) {
          initialFormValues[p.name] =
            p.type === "DATE" ? dayjs(p.defaultValue) : p.defaultValue;
        }
      });
      form.setFieldsValue(initialFormValues);
    };

    initData();
  }, [form]);

  // 2. Validate kiểm tra toàn bộ lỗi cùng lúc dưới đúng từng ô
  const validateForm = (values: Record<string, any>): boolean => {
    const fieldErrors: { name: string; errors: string[] }[] = [];

    // Kiểm tra trường bắt buộc
    paramsConfig.forEach((p) => {
      const val = values[p.name];
      if (p.required && (val === undefined || val === null || val === "")) {
        fieldErrors.push({
          name: p.name,
          errors: [`Vui lòng chọn ${p.label.toLowerCase()}`],
        });
      }
    });

    // Tìm trường Từ ngày & Đến ngày
    const fromField = paramsConfig.find(
      (p) => p.name === "fromDate" || p.name === "startDate" || p.label.toLowerCase().includes("từ ngày")
    );
    const toField = paramsConfig.find(
      (p) => p.name === "toDate" || p.name === "endDate" || p.label.toLowerCase().includes("đến ngày")
    );

    const fromDateVal = fromField ? values[fromField.name] : null;
    const toDateVal = toField ? values[toField.name] : null;

    if (fromDateVal && toDateVal && toField) {
      const from = dayjs(fromDateVal).startOf("day");
      const to = dayjs(toDateVal).startOf("day");

      // Quy tắc 1: Đến ngày phải >= Từ ngày
      if (to.isBefore(from)) {
        fieldErrors.push({
          name: toField.name,
          errors: ["Đến ngày phải ≥ Từ ngày"],
        });
      } else {
        // Quy tắc 2: Khoảng thời gian tối đa 92 ngày
        const diffDays = to.diff(from, "day");
        if (diffDays > 92) {
          fieldErrors.push({
            name: toField.name,
            errors: ["Khoảng thời gian tối đa là 92 ngày"],
          });
        }
      }
    }

    if (fieldErrors.length > 0) {
      form.setFields(fieldErrors);
      return false;
    }
    return true;
  };

  // 3. Tải file xuất báo cáo với đúng tên do Backend chỉ định
  const handleExport = async (values: Record<string, any>) => {
    if (!validateForm(values)) return;

    setSubmitting(true);
    try {
      // Chuẩn hoá payload gửi lên backend
      const payload: Record<string, any> = { format };
      Object.keys(values).forEach((key) => {
        const val = values[key];
        if (dayjs.isDayjs(val)) {
          payload[key] = val.format("YYYY-MM-DD");
        } else if (val === "ALL") {
          payload[key] = undefined;
        } else {
          payload[key] = val;
        }
      });

      // Gọi API xuất báo cáo (hỗ trợ cả GET query params và POST body tùy backend)
      let response: any;
      try {
        response = await apiClient.post("/admin/reports/revenue/export", payload, {
          responseType: "blob",
        });
      } catch (postErr) {
        // Fallback sang GET nếu BE thiết kế RESTful GET
        response = await apiClient.get("/admin/reports/revenue/export", {
          params: payload,
          responseType: "blob",
        });
      }

      // Đọc tên file chuẩn do backend đặt từ header Content-Disposition
      let fileName = `Bao_cao_doanh_thu.${format.toLowerCase()}`;
      const disposition =
        response?.headers?.["content-disposition"] ||
        response?.headers?.get?.("content-disposition");

      if (disposition) {
        const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
        const asciiMatch = disposition.match(/filename="?([^";]+)"?/i);
        if (utf8Match && utf8Match[1]) {
          fileName = decodeURIComponent(utf8Match[1]);
        } else if (asciiMatch && asciiMatch[1]) {
          fileName = asciiMatch[1];
        }
      }

      // Tạo Blob và kích hoạt tải về trên trình duyệt
      const blob = new Blob([response.data || response], {
        type:
          format === "PDF"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      message.success("Tải báo cáo thành công!");
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Lỗi khi xuất file báo cáo từ máy chủ!");
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Render động component nhập liệu theo type do BE quy định
  const renderDynamicInput = (meta: ReportParamMeta) => {
    switch (meta.type) {
      case "DATE":
        return (
          <DatePicker
            format="DD/MM/YYYY"
            placeholder="DD/MM/YYYY"
            style={{ width: "100%", height: 38 }}
          />
        );
      case "INTEGER":
        return (
          <InputNumber
            style={{ width: "100%", height: 38 }}
            precision={0}
            placeholder={`Nhập ${meta.label.toLowerCase()}`}
          />
        );
      case "DECIMAL":
        return (
          <InputNumber
            style={{ width: "100%", height: 38 }}
            step={0.1}
            placeholder={`Nhập ${meta.label.toLowerCase()}`}
          />
        );
      case "SELECT":
        return (
          <Select
            placeholder={`Chọn ${meta.label.toLowerCase()}`}
            style={{ width: "100%", height: 38 }}
            options={meta.options || []}
            allowClear={!meta.required}
          />
        );
      default:
        return (
          <Input
            style={{ width: "100%", height: 38 }}
            placeholder={`Nhập ${meta.label.toLowerCase()}`}
          />
        );
    }
  };

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e5e5",
        borderRadius: 8,
        padding: "24px 30px",
        maxWidth: 1000,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 1fr",
          gap: 36,
          alignItems: "start",
        }}
      >
        {/* CỘT TRÁI: FORM SINH TỪ DANH SÁCH THAM SỐ BE */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              marginBottom: 20,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#111111" }}>
              Báo cáo doanh thu 
            </h2>

            <Button
              onClick={() => window.history.back()}
              style={{
                borderRadius: 6,
                fontWeight: 500,
                color: "#595959",
                borderColor: "#d9d9d9",
              }}
            >
              Thoát
            </Button>
          </div>
          <Form form={form} layout="vertical" onFinish={handleExport}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {paramsConfig.map((p) => {
                const isFullRow = p.type === "STRING" || p.type === "SELECT";
                return (
                  <Form.Item
                    key={p.name}
                    name={p.name}
                    label={
                      <span>
                        {p.label} {p.required && <span style={{ color: "#ff4d4f" }}>*</span>}
                      </span>
                    }
                    style={{
                      gridColumn: isFullRow ? "span 2" : "span 1",
                      marginBottom: 16,
                    }}
                  >
                    {renderDynamicInput(p)}
                  </Form.Item>
                );
              })}
            </div>

            {/* Chọn định dạng PDF hoặc XLSX */}
            <Form.Item label="Định dạng" style={{ marginBottom: 20 }}>
              <Radio.Group value={format} onChange={(e) => setFormat(e.target.value)}>
                <Radio value="PDF">PDF</Radio>
                <Radio value="XLSX">XLSX</Radio>
              </Radio.Group>
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              style={{
                height: 38,
                padding: "0 28px",
                background: "#e4effb",
                borderColor: "#2071d4",
                color: "#111111",
                fontWeight: 500,
                borderRadius: 6,
              }}
            >
              Xuất báo cáo
            </Button>
          </Form>
        </div>
      </div>
    </div>
  );
}
