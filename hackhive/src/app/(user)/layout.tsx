"use client";

import Navbar from "@/components/common/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fffdf5]">
        <div className="text-center">
          <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-4 border-[#ffda3d] border-t-black" />
          <p className="text-sm font-bold">Entering the hive...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffdf5]">
      <Navbar />
      {children}
    </div>
  );
}