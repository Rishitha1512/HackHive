"use client";

import { useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Code2,
  CalendarDays,
  Plus,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { useCurrentUniversity } from "@/hooks/useCurrentUniversity";

const HONEYCOMB =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100' viewBox='0 0 56 100'%3E%3Cpath d='M28 66L0 50V16L28 0l28 16v34L28 66zM28 100L0 84V50l28-16 28 16v34l-28 16z' fill='none' stroke='%23000' stroke-opacity='.09' stroke-width='2'/%3E%3C/svg%3E\")";

// Points for a pointy-top hexagon.
const hexPoints = (cx: number, cy: number, r: number) =>
  [
    [cx, cy - r],
    [cx + r * 0.866, cy - r / 2],
    [cx + r * 0.866, cy + r / 2],
    [cx, cy + r],
    [cx - r * 0.866, cy + r / 2],
    [cx - r * 0.866, cy - r / 2],
  ]
    .map((p) => p.join(","))
    .join(" ");

export default function CreateTeamPage() {
  const params = useParams<{ hackathonId: string }>();
  const hackathonId = params.hackathonId;

  const router = useRouter();
  const supabase = createClient();

  const {
    university,
    loading: universityLoading,
    error: universityError,
  } = useCurrentUniversity();

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const inputClass =
    "w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black";

  const labelClass =
    "mb-2 block text-sm font-extrabold text-gray-800";

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!university) {
      setError("Your university could not be found. Please update your profile.");
      return;
    }

    const formData = new FormData(e.currentTarget);

    const name = String(formData.get("name") || "").trim();
    const description = String(
      formData.get("description") || ""
    ).trim();

    const maxTeamSize = Number(formData.get("maxTeamSize"));

    const requiredSkills = String(
      formData.get("requiredSkills") || ""
    )
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    const recruitmentDeadline = String(
      formData.get("recruitmentDeadline") || ""
    );

    if (!name || !description || !recruitmentDeadline) {
      setError("Please fill in all required fields.");
      return;
    }

    if (
      !Number.isInteger(maxTeamSize) ||
      maxTeamSize < 2 ||
      maxTeamSize > 20
    ) {
      setError("Maximum team size must be between 2 and 20.");
      return;
    }

    if (requiredSkills.length === 0) {
      setError("Please add at least one required skill.");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Your session has expired. Please log in again.");
      }

      const { error: insertError } = await supabase
        .from("teams")
        .insert({
          hackathon_id: hackathonId,
          name,
          description,
          max_team_size: maxTeamSize,
          required_skills: requiredSkills,
          recruitment_deadline: recruitmentDeadline,
        });

      if (insertError) {
        console.error("Team creation error:", insertError);

        if (insertError.message.toLowerCase().includes("overlap")) {
          throw new Error(
            "You already created a team for a hackathon with overlapping dates. You cannot create another team during that period."
          );
        }

        throw new Error(insertError.message);
      }

      router.push(`/hackathons/${hackathonId}`);
      router.refresh();
    } catch (err) {
      console.error("Team creation error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create your team. Please try again."
      );

      setSaving(false);
    }
  };

  if (universityLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffdf5]">
        <p className="font-bold text-gray-500">
          Loading your profile...
        </p>
      </main>
    );
  }

  if (universityError || !university) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffdf5] px-5">
        <div className="max-w-md rounded-2xl border-2 border-black bg-white p-8 text-center shadow-[4px_4px_0px_#000]">
          <h1 className="hive-heading text-2xl">
            University required
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-500">
            {universityError ||
              "Please add your university to your profile before creating a team."}
          </p>

          <Link
            href="/profile"
            className="mt-6 inline-flex rounded-xl border-2 border-black bg-[#ffda3d] px-5 py-3 text-sm font-extrabold"
          >
            Go to profile
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffdf5]">
      <div className="mx-auto max-w-[850px] px-5 py-8 sm:px-8">
        {/* Honeycomb heading */}
        <section
          className="relative overflow-hidden rounded-[28px] border-2 border-black bg-[#ffda3d] p-6 shadow-[6px_6px_0_#000] sm:p-8"
          style={{
            backgroundImage: HONEYCOMB,
            backgroundSize: "56px 100px",
          }}
        >
          {/* hexagon cluster */}
          <svg
            aria-hidden
            viewBox="0 0 170 150"
            className="pointer-events-none absolute -right-3 -top-3 hidden h-[150px] w-[170px] sm:block"
          >
            <polygon
              points={hexPoints(125, 38, 36)}
              fill="#fff0ae"
              stroke="#000"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <polygon
              points={hexPoints(62.6, 38, 36)}
              fill="#fff"
              stroke="#000"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <polygon
              points={hexPoints(93.8, 92, 36)}
              fill="#000"
              stroke="#000"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </svg>

          <div className="relative">
            <Link
              href={`/hackathons/${hackathonId}`}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-black bg-white px-3 py-1.5 text-xs font-bold transition hover:bg-[#fff2bf]"
            >
              <ArrowLeft size={14} />
              Back to hackathon
            </Link>

            <p className="mb-2 text-[11px] font-black uppercase tracking-[3px]">
              Find your hive
            </p>

            <h1 className="hive-heading text-4xl sm:text-5xl">
              Build your team.
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-black/70">
              Create a team, share your vision, and find talented people
              who are excited to build something together.
            </p>
          </div>
        </section>

        <section className="mt-8">
          <form
            onSubmit={handleSubmit}
            className="space-y-7 rounded-2xl border-2 border-black bg-white p-5 shadow-[4px_4px_0px_#000] sm:p-8"
          >
            <div>
              <h2 className="hive-heading text-2xl">
                Team information
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Tell other students what your team is all about.
              </p>
            </div>

            <div className="rounded-xl border-2 border-[#e8c42d] bg-[#fff9dc] p-4">
              <p className="text-xs font-extrabold uppercase text-gray-500">
                Your university
              </p>
              <p className="mt-1 font-extrabold">
                {university}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Your university will be displayed on your team.
                Students can filter teams by university.
              </p>
            </div>

            <div>
              <label className={labelClass}>
                Team name *
              </label>
              <input
                type="text"
                name="name"
                required
                maxLength={60}
                placeholder="e.g. The Innovators"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Team description *
              </label>
              <textarea
                name="description"
                required
                rows={4}
                maxLength={1000}
                placeholder="Tell potential teammates about your idea, goals, and what your team plans to build..."
                className={`${inputClass} resize-y`}
              />
            </div>

            <div>
              <label className={labelClass}>
                <Users size={16} className="mr-2 inline" />
                Maximum team size *
              </label>
              <input
                type="number"
                name="maxTeamSize"
                required
                min={2}
                max={20}
                defaultValue={4}
                className={inputClass}
              />
              <p className="mt-2 text-xs text-gray-500">
                Include yourself when deciding the maximum number of team members.
              </p>
            </div>

            <div>
              <label className={labelClass}>
                <Code2 size={16} className="mr-2 inline" />
                Required skills *
              </label>
              <input
                type="text"
                name="requiredSkills"
                required
                placeholder="e.g. React, Python, UI/UX, Machine Learning"
                className={inputClass}
              />
              <p className="mt-2 text-xs text-gray-500">
                Separate skills using commas.
              </p>
            </div>

            <div>
              <label className={labelClass}>
                <CalendarDays size={16} className="mr-2 inline" />
                Recruitment deadline *
              </label>
              <input
                type="date"
                name="recruitmentDeadline"
                required
                min={new Date().toISOString().split("T")[0]}
                className={inputClass}
              />
              <p className="mt-2 text-xs text-gray-500">
                Students should apply before this date.
              </p>
            </div>

            {error && (
              <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="border-t border-gray-200 pt-6">
              <p className="text-xs leading-5 text-gray-500">
                By creating this team, you agree to provide accurate
                information and collaborate respectfully with other members.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-[#ffda3d] px-6 py-3 text-sm font-extrabold shadow-[3px_3px_0px_#000] transition hover:-translate-y-1 hover:shadow-[5px_5px_0px_#000] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus size={17} />
                  {saving ? "Creating team..." : "Create team"}
                </button>

                <Link
                  href={`/hackathons/${hackathonId}`}
                  className="inline-flex items-center justify-center rounded-xl border-2 border-gray-300 bg-white px-6 py-3 text-sm font-bold transition hover:border-black"
                >
                  Cancel
                </Link>
              </div>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}