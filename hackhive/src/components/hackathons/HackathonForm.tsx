"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function HackathonForm() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const inputClass =
    "w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-black";

  const labelClass =
    "mb-1.5 block text-sm font-extrabold text-gray-800";

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    const startDate = String(formData.get("startDate") || "");
    const endDate = String(formData.get("endDate") || "");
    const applicationDeadline = String(
      formData.get("applicationDeadline") || ""
    );

    if (endDate < startDate) {
      setError("End date cannot be before the start date.");
      return;
    }

    if (applicationDeadline > startDate) {
      setError("Application deadline must be on or before the start date.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // Get the currently authenticated user.
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Please log in before submitting a hackathon.");
      }

      // Insert the hackathon into Supabase.
      const { error: insertError } = await supabase
        .from("hackathons")
        .insert({
          title: String(formData.get("title")).trim(),
          domain: String(formData.get("domain")),
          description: String(formData.get("description")).trim(),
          mode: String(formData.get("mode")),
          location: String(formData.get("location")).trim(),
          venue_details:
            String(formData.get("venueDetails") || "").trim() || null,
          start_date: startDate,
          end_date: endDate,
          application_deadline: applicationDeadline,
          organizer: String(formData.get("organizer")).trim(),
          contact_email: String(formData.get("email")).trim(),
          registration_url: String(
            formData.get("registrationUrl")
          ).trim(),
          website:
            String(formData.get("website") || "").trim() || null,
          created_by: user.id,
        });

      if (insertError) {
        throw insertError;
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Hackathon submission error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border-2 border-black bg-white p-8 text-center shadow-[4px_4px_0px_#000]">
        <CheckCircle2
          size={48}
          className="mx-auto mb-4 text-emerald-600"
        />

        <h2 className="hive-heading text-2xl">
          Hackathon submitted!
        </h2>

        <p className="mt-3 text-sm leading-6 text-gray-500">
          Your hackathon has been successfully added to HackHive.
        </p>

        <button
          onClick={() => router.replace("/hackathons")}
          className="mt-6 rounded-xl border-2 border-black bg-[#ffda3d] px-5 py-3 text-sm font-extrabold shadow-[3px_3px_0px_#000]"
        >
          View hackathons
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border-2 border-black bg-white p-5 shadow-[4px_4px_0px_#000] sm:p-6"
    >
      <h2 className="hive-heading text-lg">Basic information</h2>

      {/* Name + domain + mode on one row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
        <div className="sm:col-span-2 lg:col-span-1">
          <label className={labelClass}>Hackathon name *</label>
          <input
            name="title"
            type="text"
            required
            placeholder="e.g. InnovateX 2027"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Domain *</label>
          <select
            name="domain"
            required
            defaultValue=""
            className={inputClass}
          >
            <option value="" disabled>Select domain</option>
            <option>AI</option>
            <option>Web Development</option>
            <option>Software Development</option>
            <option>FinTech</option>
            <option>Cybersecurity</option>
            <option>Blockchain</option>
            <option>Other</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Mode *</label>
          <select
            name="mode"
            required
            defaultValue=""
            className={inputClass}
          >
            <option value="" disabled>Select mode</option>
            <option>Online</option>
            <option>Offline</option>
            <option>Hybrid</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Description *</label>
        <textarea
          name="description"
          required
          rows={3}
          placeholder="Describe the hackathon, its theme, and what participants can expect..."
          className={`${inputClass} resize-y`}
        />
      </div>

      <h2 className="hive-heading border-t border-gray-200 pt-4 text-lg">
        Dates and location
      </h2>

      {/* All three dates on one row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Start date *</label>
          <input
            name="startDate"
            type="date"
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>End date *</label>
          <input
            name="endDate"
            type="date"
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Application deadline *</label>
          <input
            name="applicationDeadline"
            type="date"
            required
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Location *</label>
          <input
            name="location"
            type="text"
            required
            placeholder="e.g. Bengaluru, India / Worldwide"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            Venue / Exact Address (Optional)
          </label>
          <input
            name="venueDetails"
            type="text"
            placeholder="e.g. ABC University, Main Auditorium"
            className={inputClass}
          />
        </div>
      </div>

      <h2 className="hive-heading border-t border-gray-200 pt-4 text-lg">
        Organiser and registration
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Organiser name *</label>
          <input
            name="organizer"
            type="text"
            required
            placeholder="Organisation or college name"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Contact email *</label>
          <input
            name="email"
            type="email"
            required
            placeholder="organiser@example.com"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Registration URL *</label>
          <input
            name="registrationUrl"
            type="url"
            required
            placeholder="https://example.com/register"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            Official website (optional)
          </label>
          <input
            name="website"
            type="url"
            placeholder="https://example.com"
            className={inputClass}
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-md text-xs leading-5 text-gray-500">
          By submitting, you confirm that the information provided is
          accurate and that you are authorised to share this event.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-black bg-[#ffda3d] px-6 py-3 font-extrabold shadow-[3px_3px_0px_#000] transition hover:-translate-y-1 hover:shadow-[5px_5px_0px_#000] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send size={16} />
          {loading ? "Submitting..." : "Submit hackathon"}
        </button>
      </div>
    </form>
  );
}