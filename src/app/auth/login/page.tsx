"use client";

import React, { Suspense } from "react";
import { SharedAuthCard } from "@/components/shared/SharedAuthCard";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <SharedAuthCard initialSignUp={false} />
    </Suspense>
  );
}