
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useCurrentUniversity() {
  const [university, setUniversity] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUniversity = async () => {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          throw new Error("Please log in to continue.");
        }

        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("university")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (!data?.university?.trim()) {
          throw new Error(
            "Please add your university to your profile before continuing."
          );
        }

        setUniversity(data.university.trim());
      } catch (err) {
        console.error("University fetch error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your university."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUniversity();
  }, []);

  return { university, loading, error };
}
