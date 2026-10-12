import AdminLayout from "@/components/shared/AdminLayout";
import React from "react";

export default function AdminRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
