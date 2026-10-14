"use client";

import React, { useState } from "react";
import { Table, Button, Tag, Tabs, Modal, Input, message, Tooltip } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import {
  useTicketInbox,
  useApproveTicket,
  useRejectTicket,
} from "@/features/tickets/hooks";
import { TicketResponse } from "@/features/tickets/api";
import styles from "./Tickets.module.scss";

export default function TicketsApprovalPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("PENDING");
  const [page, setPage] = useState<number>(0);
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [rejectComment, setRejectComment] = useState<string>("");

  const { data: inboxData, isLoading, refetch } = useTicketInbox({
    status: activeTab === "ALL" ? undefined : activeTab,
    page,
    size: 20,
  });

  const { mutate: approveTicket, isPending: approving } = useApproveTicket();
  const { mutate: rejectTicket, isPending: rejecting } = useRejectTicket();

  const tickets: TicketResponse[] = Array.isArray(inboxData?.content)
    ? inboxData.content
    : Array.isArray(inboxData)
    ? inboxData
    : [];

  const total = inboxData?.totalElements || tickets.length;

  const handleApprove = (ticket: TicketResponse) => {
    Modal.confirm({
      title: "Xác nhận duyệt vé",
      content: `Bạn có chắc chắn muốn duyệt phiếu cho đơn hàng #${ticket.orderId}?`,
      okText: "Duyệt ngay",
      cancelText: "Hủy",
      onOk: () => {
        approveTicket(
          { id: ticket.id },
          {
            onSuccess: () => {
              message.success(`Đã phê duyệt vé #${ticket.id} thành công!`);
            },
            onError: (err: any) => {
              message.error(err?.response?.data?.message || "Lỗi khi phê duyệt vé!");
            },
          }
        );
      },
    });
  };

  const handleOpenRejectModal = (ticketId: number) => {
    setSelectedTicketId(ticketId);
    setRejectComment("");
    setRejectModalOpen(true);
  };

  const handleConfirmReject = () => {
    if (!selectedTicketId) return;
    if (!rejectComment.trim()) {
      message.warning("Vui lòng nhập lý do từ chối!");
      return;
    }

    rejectTicket(
      { id: selectedTicketId, data: { comment: rejectComment } },
      {
        onSuccess: () => {
          message.success("Đã từ chối vé đơn hàng!");
          setRejectModalOpen(false);
        },
        onError: (err: any) => {
          message.error(err?.response?.data?.message || "Lỗi khi từ chối vé!");
        },
      }
    );
  };

  const columns = [
    {
      title: "Mã vé",
      dataIndex: "id",
      key: "id",
      width: 100,
      render: (id: number) => <strong>#{id}</strong>,
    },
    {
      title: "Mã đơn hàng",
      dataIndex: "orderId",
      key: "orderId",
      width: 130,
      render: (orderId: number) => (
        <span
          className={styles.orderLink}
          onClick={() => router.push(`/admin/orders/${orderId}`)}
        >
          Đơn #{orderId}
        </span>
      ),
    },
    {
      title: "Khách hàng yêu cầu",
      dataIndex: "requester",
      key: "requester",
      render: (requester: any) => (
        <span className={styles.requesterText}>
          {requester?.name || "Khách hàng"}
          {requester?.phone ? ` (${requester.phone})` : ""}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (st: string) => {
        let color = "orange";
        if (st === "APPROVED") color = "green";
        if (st === "REJECTED") color = "red";
        if (st === "RETURNED") color = "purple";
        return <Tag color={color}>{st}</Tag>;
      },
    },
    {
      title: "Ngày gửi",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 170,
      render: (d: string) => (
        <span className={styles.timeText}>
          {d ? dayjs(d).format("DD/MM/YYYY HH:mm") : "—"}
        </span>
      ),
    },
    {
      title: "Ghi chú",
      dataIndex: "lastComment",
      key: "lastComment",
      render: (c: string) => <span>{c || "—"}</span>,
    },
    {
      title: "Thao tác",
      key: "action",
      width: 220,
      render: (_: any, record: TicketResponse) => (
        <div className={styles.actions}>
          <Tooltip title="Xem chi tiết đơn hàng">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => router.push(`/admin/orders/${record.orderId}`)}
            />
          </Tooltip>

          {(record.status === "PENDING" ||
            record.status === "PENDING_APPROVAL" ||
            record.status === "PENDING_PO_APPROVE" ||
            record.status === "PENDING_AD_APPROVE") && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                loading={approving}
                onClick={() => handleApprove(record)}
                className={styles.btnApprove}
              >
                Duyệt
              </Button>
              <Button
                danger
                size="small"
                icon={<CloseCircleOutlined />}
                loading={rejecting}
                onClick={() => handleOpenRejectModal(record.id)}
                className={styles.btnReject}
              >
                Từ chối
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h1 className={styles.pageTitle}>
          <InboxOutlined style={{ marginRight: 8, color: "#1677ff" }} />
          Phiếu chờ duyệt (Hộp thư PO)
        </h1>
        <Button onClick={() => refetch()}>Làm mới</Button>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={(k) => {
          setActiveTab(k);
          setPage(0);
        }}
        className={styles.ticketTabs}
        items={[
          { key: "PENDING", label: "Chờ duyệt (PENDING)" },
          { key: "APPROVED", label: "Đã duyệt (APPROVED)" },
          { key: "REJECTED", label: "Đã từ chối (REJECTED)" },
          { key: "ALL", label: "Tất cả" },
        ]}
      />

      <Table
        columns={columns}
        dataSource={tickets.map((t) => ({ ...t, key: t.id }))}
        loading={isLoading}
        pagination={{
          current: page + 1,
          pageSize: 20,
          total,
          onChange: (p) => setPage(p - 1),
          showTotal: (cnt) => `Tổng cộng ${cnt} phiếu`,
        }}
      />

      <Modal
        title="Từ chối phê duyệt phiếu"
        open={rejectModalOpen}
        onOk={handleConfirmReject}
        onCancel={() => setRejectModalOpen(false)}
        okText="Xác nhận từ chối"
        cancelText="Hủy"
        okButtonProps={{ danger: true, loading: rejecting }}
      >
        <p>Vui lòng nhập lý do từ chối đơn hàng này:</p>
        <Input.TextArea
          rows={4}
          placeholder="Ví dụ: Sản phẩm trong kho đã hết, số lượng đặt vượt quá tồn kho..."
          value={rejectComment}
          onChange={(e) => setRejectComment(e.target.value)}
        />
      </Modal>
    </div>
  );
}
