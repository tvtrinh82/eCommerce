"use client";

import React, { Suspense } from "react";
import { SharedAuthCard } from "@/components/shared/SharedAuthCard";

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <SharedAuthCard initialSignUp={true} />
    </Suspense>
  );
}