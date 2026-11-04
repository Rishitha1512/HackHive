
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AuthFormProps {
  mode: "login" | "signup";
}

export default function AuthForm({ mode }: AuthFormProps) {
  const supabase = createClient();
  const isSignup = mode === "signup";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    university: "",
    location: "",
    skills: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      if (isSignup) {
        if (
          !form.fullName.trim() ||
          !form.university.trim() ||
          !form.location.trim() ||
          !form.skills.trim()
        ) {
          throw new Error("Please fill in all the fields.");
        }

        const skills = form.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean);

        // Preserve signup details while Google authentication happens.
        sessionStorage.setItem(
          "hackhive_pending_profile",
          JSON.stringify({
            full_name: form.fullName.trim(),
            university: form.university.trim(),
            location: form.location.trim(),
            skills,
          })
        );
      } else {
        // Login should not reuse old signup information.
        sessionStorage.removeItem("hackhive_pending_profile");
      }

      const { error: oauthError } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/callback`,
          },
        });

      if (oauthError) {
        throw oauthError;
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
      setLoading(false);
    }
  };

  const inputClass = "hive-input";

  return (
    <div>
      <p className="mb-2 text-[10px] font-black tracking-[3px] text-[#a57500]">
        {isSignup ? "STUDENT REGISTRATION" : "WELCOME BACK"}
      </p>

      <h1 className="hive-heading mb-6 text-4xl sm:text-[42px]">
        {isSignup ? "Create your profile." : "Enter the hive."}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignup && (
          <>
            <div>
              <label className="hive-label">Full name</label>
              <input
                required
                className={inputClass}
                placeholder="Your full name"
                value={form.fullName}
                onChange={(e) =>
                  handleChange("fullName", e.target.value)
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="hive-label">University</label>
                <input
                  required
                  className={inputClass}
                  placeholder="Your university"
                  value={form.university}
                  onChange={(e) =>
                    handleChange("university", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="hive-label">Location</label>
                <input
                  required
                  className={inputClass}
                  placeholder="City"
                  value={form.location}
                  onChange={(e) =>
                    handleChange("location", e.target.value)
                  }
                />
              </div>
            </div>

            <div>
              <label className="hive-label">Skills</label>
              <input
                required
                className={inputClass}
                placeholder="React, Python, Figma"
                value={form.skills}
                onChange={(e) =>
                  handleChange("skills", e.target.value)
                }
              />
              <p className="mt-1 text-[10px] text-gray-500">
                Separate your skills with commas.
              </p>
            </div>
          </>
        )}

        {error && (
          <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-600">
            {error}
          </p>
        )}

        <button
          disabled={loading}
          type="submit"
          className="hive-button flex w-full items-center justify-center gap-3 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            "Connecting to Google..."
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                className="h-5 w-5"
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.73 7.18l7.63 5.92c4.45-4.1 7.14-10.15 7.14-17.57Z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.47 0 11.92-2.13 15.88-5.88l-7.63-5.92c-2.12 1.42-4.84 2.25-8.25 2.25-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
                />
              </svg>

              {isSignup ? "Sign up with Google" : "Continue with Google"}

              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-xs">
        {isSignup ? "Already have an account?" : "New here?"}{" "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="font-black underline underline-offset-2"
        >
          {isSignup ? "Log in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
