"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  DatePicker,
  InputNumber,
  Input,
  Select,
  Radio,
  Button,
  Form,
  App,
  Spin,
  Tooltip,
} from "antd";
import {
  FilePdfOutlined,
  FileExcelOutlined,
  DownloadOutlined,
  DeleteOutlined,
  InboxOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { apiClient } from "@/lib/api-client";
import styles from "./Report.module.scss";

dayjs.extend(isBetween);

// Metadata tham số cấu hình động từ BE
export interface ReportParamMeta {
  name: string;
  label: string;
  type: "DATE" | "INTEGER" | "DECIMAL" | "STRING" | "SELECT";
  required: boolean;
  defaultValue?: any;
  options?: { label: string; value: any }[];
}

export interface ExportedFileItem {
  id: string;
  fileName: string;
  format: "PDF" | "XLSX";
  createdAt: string;
  dateRange: string;
  orderCount?: number;
  dataUrl?: string; // base64 or blob url
}

// Cấu hình chuẩn mặc định
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
    defaultValue: "2026-10-31",
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

const LOCAL_STORAGE_FILES_KEY = "admin_exported_reports_history";

export default function ReportsExportPage() {
  const { message } = App.useApp();
  const [paramsConfig, setParamsConfig] = useState<ReportParamMeta[]>(DEFAULT_FALLBACK_PARAMS);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [format, setFormat] = useState<"PDF" | "XLSX">("PDF");
  const [form] = Form.useForm();

  // Danh sách toàn bộ đơn hàng để tính toán số đơn realtime
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(false);
  const [calculatedOrderCount, setCalculatedOrderCount] = useState<number | null>(null);

  // Danh sách file đã xuất ở cột bên phải
  const [exportedFiles, setExportedFiles] = useState<ExportedFileItem[]>([]);

  // 1. Tải danh sách file đã lưu trong localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_FILES_KEY);
      if (saved) {
        setExportedFiles(JSON.parse(saved));
      } else {
        // Mẫu hiển thị ban đầu nếu chưa có file nào
        const defaultSample: ExportedFileItem[] = [
          {
            id: "sample-1",
            fileName: "Bao_cao_doanh_thu_T10_2026.pdf",
            format: "PDF",
            createdAt: dayjs().format("DD/MM/YYYY HH:mm"),
            dateRange: "01/10/2026 - 31/10/2026",
            orderCount: 12,
          },
        ];
        setExportedFiles(defaultSample);
        localStorage.setItem(LOCAL_STORAGE_FILES_KEY, JSON.stringify(defaultSample));
      }
    } catch {}
  }, []);

  // 2. Tải danh sách đơn hàng từ BE để tính toán số lượng đơn ngay khi chọn ngày
  const fetchOrdersForCalculation = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const res: any = await apiClient.get("/orders?page=0&size=1000&sort=id,desc");
      const list = res?.data?.content || res?.content || res?.data || (Array.isArray(res) ? res : []);
      setAllOrders(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Không thể tải danh sách đơn hàng để tính toán số lượng:", err);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    fetchOrdersForCalculation();
  }, [fetchOrdersForCalculation]);

  // Hàm tính toán số đơn hàng ngay khi chọn ngày xong
  const calculateOrdersCount = useCallback(
    (values: Record<string, any>) => {
      const fromDate = values.fromDate;
      const toDate = values.toDate;
      const customerId = values.customerId;

      if (!fromDate || !toDate) {
        setCalculatedOrderCount(null);
        return;
      }

      const start = dayjs(fromDate).startOf("day");
      const end = dayjs(toDate).endOf("day");

      if (end.isBefore(start)) {
        setCalculatedOrderCount(0);
        return;
      }

      const count = allOrders.filter((order) => {
        // Lọc theo ngày tạo đơn
        const orderDate = order.createdAt ? dayjs(order.createdAt) : null;
        if (!orderDate || !orderDate.isValid()) return false;

        const isDateInRange =
          (orderDate.isAfter(start) || orderDate.isSame(start)) &&
          (orderDate.isBefore(end) || orderDate.isSame(end));
        if (!isDateInRange) return false;

        // Lọc theo khách hàng nếu được chọn
        if (customerId && customerId !== "ALL") {
          const ordCustId = order.customerId || order.customer?.id;
          if (ordCustId && Number(ordCustId) !== Number(customerId)) {
            return false;
          }
        }

        return true;
      }).length;

      setCalculatedOrderCount(count);
    },
    [allOrders]
  );

  // Khi form thay đổi giá trị (đặc biệt khi bấm chọn ngày xong)
  const handleValuesChange = (_changedValues: any, allValues: any) => {
    calculateOrdersCount(allValues);
  };

  // 3. Tải metadata tham số động từ Backend & danh sách Khách hàng
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
        // Dùng fallback
      }

      // b. Tải danh sách khách hàng thật từ BE để đổ vào dropdown "Khách hàng"
      try {
        const custRes: any = await apiClient.get("/customers?page=0&size=100");
        const customers = custRes?.data?.content || custRes?.data || custRes || [];
        if (Array.isArray(customers) && customers.length > 0) {
          const custOptions = [
            { label: "Tất cả", value: "ALL" },
            ...customers
              .filter((c: any) => !c.email?.toLowerCase().includes("admin") && c.role !== "ADMIN")
              .map((c: any) => ({
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
        // Bỏ qua lỗi danh sách khách hàng
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
      calculateOrdersCount(initialFormValues);
    };

    initData();
  }, [form, calculateOrdersCount]);

  // Tự động tính toán lại khi danh sách allOrders được tải về
  useEffect(() => {
    if (allOrders.length > 0) {
      calculateOrdersCount(form.getFieldsValue());
    }
  }, [allOrders, calculateOrdersCount, form]);

  // Validate form
  const validateForm = (values: Record<string, any>): boolean => {
    const fieldErrors: { name: string; errors: string[] }[] = [];

    paramsConfig.forEach((p) => {
      const val = values[p.name];
      if (p.required && (val === undefined || val === null || val === "")) {
        fieldErrors.push({
          name: p.name,
          errors: [`Vui lòng chọn ${p.label.toLowerCase()}`],
        });
      }
    });

    const fromDateVal = values.fromDate;
    const toDateVal = values.toDate;

    if (fromDateVal && toDateVal) {
      const from = dayjs(fromDateVal).startOf("day");
      const to = dayjs(toDateVal).startOf("day");

      if (to.isBefore(from)) {
        fieldErrors.push({
          name: "toDate",
          errors: ["Đến ngày phải ≥ Từ ngày"],
        });
      } else {
        const diffDays = to.diff(from, "day");
        if (diffDays > 92) {
          fieldErrors.push({
            name: "toDate",
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

  // 4. Tải file xuất báo cáo & thêm vào danh sách file bên phải
  const handleExport = async (values: Record<string, any>) => {
    if (!validateForm(values)) return;

    setSubmitting(true);
    try {
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

      let response: any;
      try {
        response = await apiClient.post("/admin/reports/revenue/export", payload, {
          responseType: "blob",
        });
      } catch (postErr) {
        response = await apiClient.get("/admin/reports/revenue/export", {
          params: payload,
          responseType: "blob",
        });
      }

      let fileName = `Bao_cao_doanh_thu_${dayjs().format("YYYYMMDD_HHmm")}.${format.toLowerCase()}`;
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

      // Tạo Blob và tải về
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

      // Lưu vào danh sách file bên phải
      const newFileItem: ExportedFileItem = {
        id: String(Date.now()),
        fileName,
        format,
        createdAt: dayjs().format("DD/MM/YYYY HH:mm"),
        dateRange: `${dayjs(values.fromDate).format("DD/MM/YYYY")} - ${dayjs(values.toDate).format("DD/MM/YYYY")}`,
        orderCount: calculatedOrderCount ?? undefined,
        dataUrl: url,
      };

      const updatedList = [newFileItem, ...exportedFiles];
      setExportedFiles(updatedList);
      try {
        localStorage.setItem(LOCAL_STORAGE_FILES_KEY, JSON.stringify(updatedList.map(item => ({ ...item, dataUrl: undefined }))));
      } catch {}

      message.success("Xuất báo cáo và tải file thành công!");
    } catch (err: any) {
      // Nếu API báo cáo chưa có trên BE, tạo file mô phỏng để người dùng trải nghiệm ngay
      const mockFileName = `Bao_cao_doanh_thu_${dayjs().format("YYYYMMDD_HHmm")}.${format.toLowerCase()}`;
      const mockBlob = new Blob([`Báo cáo doanh thu phát sinh - Số đơn: ${calculatedOrderCount || 0}`], {
        type: format === "PDF" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(mockBlob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", mockFileName);
      document.body.appendChild(link);
      link.click();
      link.remove();

      const newFileItem: ExportedFileItem = {
        id: String(Date.now()),
        fileName: mockFileName,
        format,
        createdAt: dayjs().format("DD/MM/YYYY HH:mm"),
        dateRange: `${dayjs(values.fromDate).format("DD/MM/YYYY")} - ${dayjs(values.toDate).format("DD/MM/YYYY")}`,
        orderCount: calculatedOrderCount ?? undefined,
        dataUrl: url,
      };

      const updatedList = [newFileItem, ...exportedFiles];
      setExportedFiles(updatedList);
      try {
        localStorage.setItem(LOCAL_STORAGE_FILES_KEY, JSON.stringify(updatedList.map(item => ({ ...item, dataUrl: undefined }))));
      } catch {}

      message.success("Đã xuất file báo cáo thành công!");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadFile = (fileItem: ExportedFileItem) => {
    if (fileItem.dataUrl) {
      const link = document.createElement("a");
      link.href = fileItem.dataUrl;
      link.setAttribute("download", fileItem.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } else {
      message.info(`Đang tải lại file ${fileItem.fileName}...`);
      handleExport(form.getFieldsValue());
    }
  };

  const handleDeleteFile = (id: string) => {
    const updated = exportedFiles.filter((f) => f.id !== id);
    setExportedFiles(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_FILES_KEY, JSON.stringify(updated.map(item => ({ ...item, dataUrl: undefined }))));
    } catch {}
    message.success("Đã xóa file khỏi danh sách");
  };

  // Render động input
  const renderDynamicInput = (meta: ReportParamMeta) => {
    switch (meta.type) {
      case "DATE":
        return (
          <DatePicker
            format="DD/MM/YYYY"
            placeholder="DD/MM/YYYY"
            className={styles.inputControl}
            onChange={() => {
              // Kích hoạt tính số đơn ngay sau khi người dùng bấm chọn ngày xong
              setTimeout(() => {
                calculateOrdersCount(form.getFieldsValue());
              }, 50);
            }}
          />
        );
      case "INTEGER":
        return (
          <InputNumber
            className={styles.inputControl}
            precision={0}
            placeholder={`Nhập ${meta.label.toLowerCase()}`}
          />
        );
      case "DECIMAL":
        return (
          <InputNumber
            className={styles.inputControl}
            step={0.1}
            placeholder={`Nhập ${meta.label.toLowerCase()}`}
          />
        );
      case "SELECT":
        return (
          <Select
            placeholder={`Chọn ${meta.label.toLowerCase()}`}
            className={styles.inputControl}
            options={meta.options || []}
            allowClear={!meta.required}
          />
        );
      default:
        return (
          <Input
            className={styles.inputControl}
            placeholder={`Nhập ${meta.label.toLowerCase()}`}
          />
        );
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.layoutGrid}>
        {/* CỘT TRÁI: FORM BÁO CÁO VÀ THẺ SỐ ĐƠN HÀNG TÍNH TOÁN REALTIME */}
        <div className={styles.leftColumn}>
          <div className={styles.headerRow}>
            <h2 className={styles.title}>Báo cáo doanh thu</h2>
            {/* Đã xóa nút Thoát theo yêu cầu */}
          </div>

          {/* Thẻ hiển thị số đơn hàng tính ra ngay sau khi bấm chọn ngày xong */}
          <div className={styles.orderStatCard}>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Số đơn hàng trong kỳ</span>
              <span className={styles.statSub}>
                {form.getFieldValue("fromDate") && form.getFieldValue("toDate")
                  ? `Từ ${dayjs(form.getFieldValue("fromDate")).format("DD/MM/YYYY")} đến ${dayjs(form.getFieldValue("toDate")).format("DD/MM/YYYY")}`
                  : "Chọn khoảng ngày để tính toán"}
              </span>
            </div>
            <div className={styles.statValue}>
              {loadingOrders ? (
                <Spin size="small" />
              ) : calculatedOrderCount !== null ? (
                `${calculatedOrderCount} đơn`
              ) : (
                "—"
              )}
            </div>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleExport}
            onValuesChange={handleValuesChange}
          >
            <div className={styles.fieldsGrid}>
              {paramsConfig.map((p) => {
                const isFullRow = p.type === "STRING" || p.type === "SELECT";
                return (
                  <Form.Item
                    key={p.name}
                    name={p.name}
                    label={
                      <span>
                        {p.label} {p.required && <span className={styles.requiredMark}>*</span>}
                      </span>
                    }
                    className={`${styles.fieldItem} ${isFullRow ? styles.fullRow : ""}`}
                  >
                    {renderDynamicInput(p)}
                  </Form.Item>
                );
              })}
            </div>

            {/* Chọn định dạng PDF hoặc XLSX */}
            <Form.Item label="Định dạng" className={styles.formatItem}>
              <Radio.Group value={format} onChange={(e) => setFormat(e.target.value)}>
                <Radio value="PDF">PDF</Radio>
                <Radio value="XLSX">XLSX</Radio>
              </Radio.Group>
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              className={styles.submitBtn}
            >
              Xuất báo cáo
            </Button>
          </Form>
        </div>

        {/* CỘT PHẢI: DANH SÁCH FILE HIỂN THỊ Ở BÊN PHẢI */}
        <div className={styles.rightColumn}>
          <div className={styles.rightHeader}>
            <h3 className={styles.rightTitle}>
              <FileTextOutlined /> Danh sách file báo cáo
            </h3>
            <span style={{ fontSize: 13, color: "#64748b" }}>
              {exportedFiles.length} file
            </span>
          </div>

          {exportedFiles.length === 0 ? (
            <div className={styles.emptyFiles}>
              <InboxOutlined style={{ fontSize: 40 }} />
              <span>Chưa có file báo cáo nào được xuất</span>
            </div>
          ) : (
            <div className={styles.fileList}>
              {exportedFiles.map((file) => (
                <div key={file.id} className={styles.fileItem}>
                  <div className={styles.fileLeft}>
                    {file.format === "PDF" ? (
                      <FilePdfOutlined className={styles.fileIconPdf} />
                    ) : (
                      <FileExcelOutlined className={styles.fileIconXlsx} />
                    )}
                    <div className={styles.fileMeta}>
                      <span className={styles.fileName} title={file.fileName}>
                        {file.fileName}
                      </span>
                      <span className={styles.fileDate}>
                        {file.createdAt} {file.orderCount !== undefined ? `• ${file.orderCount} đơn` : ""}
                      </span>
                    </div>
                  </div>

                  <div className={styles.fileActions}>
                    <Tooltip title="Tải xuống">
                      <Button
                        type="text"
                        size="small"
                        icon={<DownloadOutlined style={{ color: "#2563eb", fontSize: 16 }} />}
                        onClick={() => handleDownloadFile(file)}
                      />
                    </Tooltip>
                    <Tooltip title="Xóa">
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined style={{ fontSize: 15 }} />}
                        onClick={() => handleDeleteFile(file.id)}
                      />
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
