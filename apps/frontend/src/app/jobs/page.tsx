"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function JobsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to direct internship application portal
    router.replace("/");
  }, [router]);

  return null;
}
