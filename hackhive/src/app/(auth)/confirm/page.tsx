
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ConfirmPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Confirming your email...");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (active && session) {
        router.replace("/profile");
        router.refresh();
      }
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;

      if (error || !data.session) {
        setHasError(true);
        setMessage(
          "Email confirmation failed or the link has expired. Please try signing up again."
        );
      } else {
        router.replace("/profile");
        router.refresh();
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <h1 className="hive-heading text-3xl mb-4">
          {hasError ? "Oops!" : "Welcome to HackHive!"}
        </h1>
        <p>{message}</p>
      </div>
    </main>
  );
}
