
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CompleteProfilePage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const completeProfile = async () => {
      const supabase = createClient();

      try {
        const { data: { user }, error: userError } =
          await supabase.auth.getUser();

        if (userError || !user) {
          router.replace("/login");
          return;
        }

        const pendingData = sessionStorage.getItem(
          "hackhive_pending_profile"
        );

        // Existing Google users logging in go straight to their profile.
        if (!pendingData) {
          router.replace("/profile");
          return;
        }

        const profile = JSON.parse(pendingData);

        const { error: saveError } = await supabase
          .from("profiles")
          .upsert(
            {
              id: user.id,
              full_name:
                profile.full_name ||
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                "",
              university: profile.university,
              location: profile.location,
              skills: profile.skills,
            },
            { onConflict: "id" }
          );

        if (saveError) {
          throw saveError;
        }

        sessionStorage.removeItem("hackhive_pending_profile");

        router.replace("/profile");
        router.refresh();
      } catch (err) {
        console.error("Profile completion error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Could not save your profile."
        );
      }
    };

    completeProfile();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="hive-heading mb-4 text-3xl">
          Welcome to HackHive!
        </h1>

        {error ? (
          <>
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => router.replace("/profile")}
              className="mt-5 font-bold underline"
            >
              Continue to profile
            </button>
          </>
        ) : (
          <p className="text-sm text-gray-600">
            Setting up your profile. Please wait...
          </p>
        )}
      </div>
    </main>
  );
}
