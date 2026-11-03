"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface AuthFormProps {
  mode: "login" | "signup";
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { login, signup } = useAuth();

  const isSignup = mode === "signup";

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    university: "",
    location: "",
    skills: "",
    interests: "",
    githubOrPortfolio: "",
    profilePicture: "",
    email: "",
    password: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignup) {
        signup(
          {
            fullName: form.fullName.trim(),
            university: form.university.trim(),
            location: form.location.trim(),
            skills: form.skills
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
            interests: form.interests
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
            githubOrPortfolio: form.githubOrPortfolio.trim(),
            profilePicture: form.profilePicture.trim(),
            email: form.email.trim(),
          },
          form.password
        );

        router.push("/profile");
      } else {
        const role = login(form.email, form.password);

        if (!role) {
          setError("Invalid email or password. Please try again.");
          setLoading(false);
          return;
        }

        router.push(role === "admin" ? "/admin" : "/profile");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    }

    setLoading(false);
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

      <form onSubmit={handleSubmit} className="space-y-3">
        {isSignup && (
          <>
            <div>
              <label className="hive-label">Full name</label>
              <input
                required
                className={inputClass}
                placeholder="Your full name"
                value={form.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
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
                  onChange={(e) => handleChange("location", e.target.value)}
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
                onChange={(e) => handleChange("skills", e.target.value)}
              />
            </div>

            <div>
              <label className="hive-label">Interests</label>
              <input
                required
                className={inputClass}
                placeholder="Web development, UI/UX"
                value={form.interests}
                onChange={(e) =>
                  handleChange("interests", e.target.value)
                }
              />
            </div>

            <div>
              <label className="hive-label">
                GitHub or portfolio URL (optional)
              </label>
              <input
                type="url"
                className={inputClass}
                placeholder="https://github.com/username"
                value={form.githubOrPortfolio}
                onChange={(e) =>
                  handleChange("githubOrPortfolio", e.target.value)
                }
              />
            </div>

            <div>
              <label className="hive-label">
                Profile picture URL (optional)
              </label>
              <input
                type="url"
                className={inputClass}
                placeholder="https://example.com/photo.jpg"
                value={form.profilePicture}
                onChange={(e) =>
                  handleChange("profilePicture", e.target.value)
                }
              />
            </div>
          </>
        )}

        <div>
          <label className="hive-label">Email</label>
          <input
            required
            type="email"
            className={inputClass}
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
          />
        </div>

        <div>
          <label className="hive-label">Password</label>

          <div className="relative">
            <input
              required
              minLength={6}
              type={showPassword ? "text" : "password"}
              className={`${inputClass} pr-12`}
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) =>
                handleChange("password", e.target.value)
              }
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        {error && (
          <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-600">
            {error}
          </p>
        )}

        <button
          disabled={loading}
          type="submit"
          className="hive-button w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Please wait..."
            : isSignup
              ? "Create account"
              : "Log in"}

          {!loading && <ArrowRight size={16} />}
        </button>
      </form>

      {!isSignup && (
        <div className="mt-5 rounded-xl border border-black bg-[#fff7d6] p-3 text-[11px] leading-5">
          <p className="mb-1 font-black">Student demo:</p>
          <p>riya@hackhive.dev / demo1234</p>

          <p className="mb-1 mt-2 font-black">Admin demo:</p>
          <p>admin@hackhive.dev / admin1234</p>
        </div>
      )}

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