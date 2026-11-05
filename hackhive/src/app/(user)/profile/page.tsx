"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

import {
  ArrowRight,
  Check,
  Edit3,
  ExternalLink,
  GraduationCap,
  Mail,
  MapPin,
  Pencil,
  Save,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";

/* ---------- helpers ---------- */

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame: number;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

const HONEYCOMB =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100' viewBox='0 0 56 100'%3E%3Cpath d='M28 66L0 50V16L28 0l28 16v34L28 66zM28 100L0 84V50l28-16 28 16v34l-28 16z' fill='none' stroke='%23000' stroke-opacity='.09' stroke-width='2'/%3E%3C/svg%3E\")";

const HONEYCOMB_YELLOW = HONEYCOMB.replace("%23000", "%23ffda3d").replace(
  ".09",
  ".14"
);

const pop = (delay: number) => ({ "--d": `${delay}ms` } as React.CSSProperties);

const splitList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();

  const supabase = createClient();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    university: "",
    location: "",
    bio: "",
    skills: "",
    interests: "",
    githubOrPortfolio: "",
  });

  const resetForm = () => {
    if (!user) return;
    setForm({
      fullName: user.fullName,
      university: user.university,
      location: user.location,
      bio: user.bio,
      skills: user.skills.join(", "),
      interests: user.interests.join(", "),
      githubOrPortfolio: user.githubOrPortfolio,
    });
  };

  useEffect(() => {
    resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const openEditor = () => {
    resetForm();
    setEditing(true);
  };

  const closeEditor = () => {
    if (saving) return;
    resetForm();
    setEditing(false);
  };

  // Modal: lock page scroll + close on Escape.
  useEffect(() => {
    if (!editing) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) {
        resetForm();
        setEditing(false);
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, saving]);

  const handleChange = (field: string, value: string) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // Upload profile picture to Supabase Storage.
  const handleProfilePictureChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file || !user) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setToast({ message: "Please select a JPG, PNG or WEBP image.", type: "error" });
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setToast({ message: "Image size must be less than 2 MB.", type: "error" });
      event.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);

    try {
      setUploadingPicture(true);
      setPreviewUrl(objectUrl);

      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

      const filePath = `${user.id}/${Date.now()}-${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(filePath, file, {
          contentType: file.type,
          cacheControl: "3600",
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from("profile-pictures")
        .getPublicUrl(filePath);

      await updateProfile({
        profilePicture: data.publicUrl,
      });

      setToast({ message: "Profile picture updated!", type: "success" });
    } catch (error) {
      console.error("Profile picture upload failed:", error);

      setToast({
        message:
          error instanceof Error
            ? error.message
            : "Could not upload profile picture.",
        type: "error",
      });
    } finally {
      URL.revokeObjectURL(objectUrl);
      setPreviewUrl("");
      setUploadingPicture(false);

      event.target.value = "";
    }
  };

  // Save profile information.
  const handleSave = async () => {
    try {
      setSaving(true);

      await updateProfile({
        fullName: form.fullName.trim(),
        university: form.university.trim(),
        location: form.location.trim(),
        bio: form.bio.trim(),
        skills: splitList(form.skills),
        interests: splitList(form.interests),
        githubOrPortfolio: form.githubOrPortfolio.trim(),
      });

      setEditing(false);
      setToast({ message: "Profile updated successfully!", type: "success" });
    } catch (error) {
      console.error("Profile update failed:", error);
      setToast({
        message:
          error instanceof Error ? error.message : "Could not update profile.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const completionFields = user
    ? [
        user.fullName,
        user.university,
        user.location,
        user.bio,
        user.skills.length > 0,
        user.interests.length > 0,
        user.githubOrPortfolio,
      ]
    : [];

  const completion = completionFields.length
    ? Math.round(
        (completionFields.filter(Boolean).length / completionFields.length) *
          100
      )
    : 0;

  const animatedCompletion = useCountUp(completion, 1100);

  if (!user) return null;

  return (
    <main className="relative mx-auto max-w-[1280px] px-5 py-8 sm:px-8 lg:py-10">
      <style>{`
        @keyframes pf-pop {
          0%   { opacity: 0; transform: translateY(24px) scale(.92); }
          60%  { opacity: 1; transform: translateY(-4px) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pf-chip {
          0%   { opacity: 0; transform: scale(.4) rotate(-6deg); }
          70%  { transform: scale(1.12) rotate(2deg); }
          100% { opacity: 1; transform: scale(1) rotate(0); }
        }
        @keyframes pf-float {
          0%, 100% { transform: translateY(0) rotate(-4deg); }
          50%      { transform: translateY(-10px) rotate(4deg); }
        }
        @keyframes pf-toast {
          0%   { opacity: 0; transform: translateX(40px) scale(.9); }
          70%  { transform: translateX(-4px) scale(1.02); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes pf-wiggle {
          0%, 100% { transform: rotate(0); }
          25% { transform: rotate(-8deg); }
          75% { transform: rotate(8deg); }
        }
        @keyframes pf-shine {
          0%   { transform: translateX(-120%) skewX(-20deg); }
          100% { transform: translateX(320%) skewX(-20deg); }
        }
        @keyframes pf-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes pf-modal {
          0%   { opacity: 0; transform: translateY(40px) scale(.9); }
          65%  { opacity: 1; transform: translateY(-6px) scale(1.015); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        .pf-pop {
          opacity: 0;
          animation: pf-pop .65s cubic-bezier(.34,1.56,.64,1) forwards;
          animation-delay: var(--d, 0ms);
        }
        .pf-chip {
          opacity: 0;
          animation: pf-chip .5s cubic-bezier(.34,1.56,.64,1) forwards;
          animation-delay: var(--d, 0ms);
        }
        .pf-card { transition: transform .2s ease, box-shadow .2s ease; }
        .pf-card:hover {
          transform: translate(-3px, -3px);
          box-shadow: 6px 6px 0 #000;
        }
        .pf-hex { transition: transform .25s cubic-bezier(.34,1.56,.64,1); }
        .pf-hex:hover { transform: scale(1.1) rotate(-3deg); }
        .pf-chip-hover { transition: transform .18s cubic-bezier(.34,1.56,.64,1); }
        .pf-chip-hover:hover { transform: translateY(-3px) rotate(-2deg) scale(1.06); }
        .pf-float { animation: pf-float 3.6s ease-in-out infinite; }
        .pf-avatar { transition: transform .25s cubic-bezier(.34,1.56,.64,1); }
        .pf-avatar:hover { transform: scale(1.05) rotate(-3deg); }
        .pf-avatar:hover .pf-pencil { animation: pf-wiggle .5s ease; }
        .pf-toast { animation: pf-toast .5s cubic-bezier(.34,1.56,.64,1) forwards; }
        .pf-overlay { animation: pf-fade .2s ease forwards; }
        .pf-modal { animation: pf-modal .5s cubic-bezier(.34,1.56,.64,1) forwards; }
        .pf-shine { position: relative; overflow: hidden; }
        .pf-shine::after {
          content: "";
          position: absolute; top: 0; left: 0;
          width: 35%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.55), transparent);
          animation: pf-shine 3.2s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .pf-pop, .pf-chip, .pf-toast, .pf-overlay, .pf-modal { animation: none; opacity: 1; }
          .pf-float, .pf-shine::after { animation: none; }
          .pf-card:hover, .pf-chip-hover:hover, .pf-hex:hover, .pf-avatar:hover { transform: none; }
        }
      `}</style>

      {/* TOAST */}

      {toast && (
        <div
          role="status"
          className={`pf-toast fixed right-5 top-20 z-[70] flex items-center gap-2 rounded-xl border-2 border-black px-4 py-3 text-xs font-bold shadow-[4px_4px_0_#000] ${
            toast.type === "success" ? "bg-[#ffda3d]" : "bg-red-200"
          }`}
        >
          {toast.type === "success" ? <Check size={15} /> : <X size={15} />}
          {toast.message}
        </div>
      )}

      {/* HIDDEN FILE INPUT */}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleProfilePictureChange}
      />

      {/* ============ HERO ============ */}

      <section
        className="pf-pop relative mb-8 overflow-hidden rounded-[32px] border-2 border-black bg-[#ffda3d] p-6 shadow-[6px_6px_0_#000] sm:p-9"
        style={{
          ...pop(0),
          backgroundImage: HONEYCOMB,
          backgroundSize: "56px 100px",
        }}
      >
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          {/* LEFT */}

          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
            <div className="pf-avatar relative h-32 w-32 shrink-0">
              <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full border-[3px] border-black bg-white text-5xl font-black shadow-[4px_4px_0_#000]">
                {previewUrl || user.profilePicture ? (
                  <Image
                    src={previewUrl || user.profilePicture}
                    alt={user.fullName}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  user.fullName.charAt(0).toUpperCase()
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPicture}
                title="Change profile picture"
                aria-label="Change profile picture"
                className="pf-pencil absolute -bottom-1 -right-1 z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-black bg-white shadow-[2px_2px_0_#000] transition hover:bg-[#fff2bf] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploadingPicture ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                ) : (
                  <Pencil size={15} />
                )}
              </button>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-black tracking-[3px] text-black/70">
                YOUR HIVE, YOUR JOURNEY
              </p>

              <h1 className="hive-heading text-4xl sm:text-5xl">
                Hey, {user.fullName.split(" ")[0]}!
              </h1>

              <p className="mt-2 text-sm font-medium text-black/70">
                Your next great collaboration starts here.
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                {[
                  {
                    icon: <GraduationCap size={13} />,
                    value: user.university,
                    placeholder: "+ Add university",
                  },
                  {
                    icon: <MapPin size={13} />,
                    value: user.location,
                    placeholder: "+ Add location",
                  },
                ].map((chip, i) =>
                  chip.value ? (
                    <span
                      key={i}
                      className="pf-chip pf-chip-hover inline-flex items-center gap-1.5 rounded-full border border-black bg-white px-4 py-2 text-[11px] font-bold shadow-[2px_2px_0_#000]"
                      style={pop(200 + i * 90)}
                    >
                      {chip.icon} {chip.value}
                    </span>
                  ) : (
                    <button
                      key={i}
                      onClick={openEditor}
                      className="pf-chip pf-chip-hover inline-flex items-center gap-1.5 rounded-full border border-dashed border-black bg-white/50 px-4 py-2 text-[11px] font-bold text-black/70 hover:bg-white"
                      style={pop(200 + i * 90)}
                    >
                      {chip.icon} {chip.placeholder}
                    </button>
                  )
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                {completion < 100 ? (
                  /* Progress lives inside the button until the profile is 100% complete */
                  <button
                    onClick={openEditor}
                    aria-label={`Complete your profile, currently ${completion}%`}
                    className="w-[230px] rounded-lg border-2 border-black bg-white px-4 py-2.5 text-left shadow-[3px_3px_0_#000] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                  >
                    <span className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-2">
                        <Edit3 size={14} />
                        Complete your profile
                      </span>
                      <span className="rounded-full bg-[#ffda3d] px-2 py-0.5 text-[10px] font-black">
                        {animatedCompletion}%
                      </span>
                    </span>
                    <span className="mt-2 block h-1.5 overflow-hidden rounded-full border border-black bg-[#fff0ae]">
                      <span
                        className="block h-full rounded-full bg-black"
                        style={{ width: `${animatedCompletion}%` }}
                      />
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={openEditor}
                    className="flex items-center gap-2 rounded-lg border-2 border-black bg-white px-4 py-2.5 text-xs font-bold shadow-[3px_3px_0_#000] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                  >
                    <Edit3 size={14} />
                    Edit profile
                  </button>
                )}

                <Link href="/hackathons" className="hive-button w-fit">
                  Explore hackathons <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ============ CONTENT ============ */}

      {/* One horizontal box: About | Skills + Interests | Details */}

      <section
        className="pf-pop overflow-hidden rounded-[28px] border-2 border-black bg-white shadow-[5px_5px_0_#000]"
        style={pop(300)}
      >
        <div className="grid lg:grid-cols-[1fr_340px]">
          {/* LEFT COLUMN: About, Superpowers, Interests stacked */}
          <div className="flex flex-col">
          {/* ABOUT */}

          <div className="px-6 pt-6 sm:px-7 sm:pt-7">
            <p className="text-[10px] font-black tracking-[2px] text-[#b48600]">
              ABOUT YOU
            </p>
            <h2 className="hive-heading mb-3 mt-1 text-2xl">The buzz about me</h2>

            <p
              className={
                user.bio && user.bio.length <= 90
                  ? "text-lg font-semibold leading-snug text-black"
                  : "text-sm leading-7 text-gray-600"
              }
            >
              {user.bio ||
                "No bio added yet. Tell other builders what you're about!"}
            </p>
          </div>

          {/* SUPERPOWERS */}

          <div className="px-6 pt-4 sm:px-7">
            <h3 className="mb-3 text-[10px] font-black tracking-[2px] text-[#b48600]">
              SUPERPOWERS
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {user.skills.map((skill, i) => (
                <span
                  key={skill}
                  className="pf-chip pf-chip-hover cursor-default rounded-full border border-black bg-[#ffda3d] px-4 py-2 text-xs font-bold shadow-[2px_2px_0_#000]"
                  style={pop(450 + i * 70)}
                >
                  {skill}
                </span>
              ))}
              {user.skills.length === 0 && (
                <button
                  onClick={openEditor}
                  className="rounded-full border border-dashed border-black px-4 py-2 text-xs font-bold text-gray-500 transition hover:bg-[#fff2bf]"
                >
                  + Add your first skill
                </button>
              )}
            </div>
          </div>

          {/* INTERESTS */}

          <div className="px-6 pb-6 pt-4 sm:px-7 sm:pb-7">
            <h3 className="mb-3 text-[10px] font-black tracking-[2px] text-[#b48600]">
              INTERESTS
            </h3>
            <div className="flex flex-wrap gap-2">
              {user.interests.map((interest, i) => (
                <span
                  key={interest}
                  className="pf-chip pf-chip-hover cursor-default rounded-full border border-black bg-[#fff8d6] px-3 py-1.5 text-xs font-semibold"
                  style={pop(500 + i * 70)}
                >
                  {interest}
                </span>
              ))}
              {user.interests.length === 0 && (
                <button
                  onClick={openEditor}
                  className="rounded-full border border-dashed border-black px-4 py-2 text-xs font-bold text-gray-500 transition hover:bg-[#fff2bf]"
                >
                  + Add interests
                </button>
              )}
            </div>
          </div>
          </div>

          {/* DETAILS */}

          <div
            className="border-t-2 border-black bg-[#fff8d6] p-6 sm:p-7 lg:border-l-2 lg:border-t-0"
            style={{
              backgroundImage: HONEYCOMB,
              backgroundSize: "56px 100px",
            }}
          >
            <p className="text-[10px] font-black tracking-[2px] text-[#b48600]">
              DETAILS
            </p>
            <h2 className="hive-heading mb-4 mt-1 text-2xl">Find me</h2>

            <ul className="space-y-3.5 text-sm font-semibold">
              {[
                {
                  icon: <GraduationCap size={16} />,
                  text: user.university || "University not added",
                },
                {
                  icon: <MapPin size={16} />,
                  text: user.location || "Location not added",
                },
                { icon: <Mail size={16} />, text: user.email },
              ].map((row, i) => (
                <li
                  key={i}
                  className="pf-chip flex items-center gap-3 break-all"
                  style={pop(450 + i * 80)}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black bg-[#ffda3d]">
                    {row.icon}
                  </span>
                  {row.text}
                </li>
              ))}
            </ul>

            {user.githubOrPortfolio ? (
              <a
                href={user.githubOrPortfolio}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-white px-4 py-2.5 text-xs font-black shadow-[3px_3px_0_#000] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[#ffda3d] hover:shadow-[5px_5px_0_#000]"
              >
                <ExternalLink size={14} /> GitHub / Portfolio
              </a>
            ) : (
              <button
                onClick={openEditor}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-black px-4 py-2.5 text-xs font-bold text-gray-500 transition hover:bg-[#ffda3d]"
              >
                + Add portfolio link
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ============ HACKATHONS STRIP ============ */}

      <section
        className="pf-pop mt-6 overflow-hidden rounded-[28px] border-2 border-black bg-black p-6 text-white sm:px-8"
        style={{
          ...pop(560),
          backgroundImage: HONEYCOMB_YELLOW,
          backgroundSize: "56px 100px",
        }}
      >
        <div className="flex flex-col items-center justify-between gap-5 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#ffda3d] text-black">
              <Trophy size={26} />
            </div>
            <div>
              <p className="text-[10px] font-black tracking-[2px] text-[#ffda3d]">
                YOUR JOURNEY SO FAR
              </p>
              <h2 className="hive-heading text-2xl text-white sm:text-3xl">
                Participated hackathons
              </h2>
              <p className="mt-1 text-xs text-white/60">
                Nothing here yet. Your first build is waiting.
              </p>
            </div>
          </div>

          <Link
            href="/hackathons"
            className="pf-shine inline-flex shrink-0 items-center gap-2 rounded-lg border-2 border-[#ffda3d] bg-[#ffda3d] px-4 py-2.5 text-xs font-black text-black transition hover:scale-105"
          >
            <Sparkles size={14} /> Find a hackathon
          </Link>
        </div>
      </section>

      {/* ============ EDIT PROFILE MODAL ============ */}

      {editing && (
        <div
          className="pf-overlay fixed inset-0 z-[60] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeEditor();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            className="pf-modal flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] border-2 border-black bg-white shadow-[8px_8px_0_#ffda3d] sm:rounded-[28px]"
          >
            {/* header */}
            <div
              className="relative flex items-start justify-between gap-4 border-b-2 border-black bg-[#ffda3d] px-6 py-5"
              style={{
                backgroundImage: HONEYCOMB,
                backgroundSize: "56px 100px",
              }}
            >
              <div>
                <p className="text-[10px] font-black tracking-[3px] text-black/70">
                  YOUR HIVE CARD
                </p>
                <h2 id="edit-profile-title" className="hive-heading text-3xl">
                  Edit profile
                </h2>
              </div>

              <button
                onClick={closeEditor}
                disabled={saving}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-black bg-white transition hover:rotate-90 hover:bg-[#fff2bf] disabled:opacity-50"
                style={{ transitionDuration: ".25s" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* body */}
            <form
              id="edit-profile-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="grid flex-1 gap-5 overflow-y-auto px-6 py-6 sm:grid-cols-2"
            >
              <div>
                <label className="hive-label" htmlFor="pf-name">
                  Full name
                </label>
                <input
                  id="pf-name"
                  autoFocus
                  className="hive-input"
                  value={form.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                />
              </div>

              <div>
                <label className="hive-label" htmlFor="pf-uni">
                  University
                </label>
                <input
                  id="pf-uni"
                  className="hive-input"
                  value={form.university}
                  onChange={(e) => handleChange("university", e.target.value)}
                />
              </div>

              <div>
                <label className="hive-label" htmlFor="pf-loc">
                  Location
                </label>
                <input
                  id="pf-loc"
                  className="hive-input"
                  value={form.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                />
              </div>

              <div>
                <label className="hive-label" htmlFor="pf-link">
                  GitHub / Portfolio URL
                </label>
                <input
                  id="pf-link"
                  type="url"
                  className="hive-input"
                  placeholder="https://github.com/you"
                  value={form.githubOrPortfolio}
                  onChange={(e) =>
                    handleChange("githubOrPortfolio", e.target.value)
                  }
                />
              </div>

              <div className="sm:col-span-2">
                <label className="hive-label" htmlFor="pf-bio">
                  Bio
                </label>
                <textarea
                  id="pf-bio"
                  rows={3}
                  className="hive-input resize-none"
                  placeholder="Tell us about yourself..."
                  value={form.bio}
                  onChange={(e) => handleChange("bio", e.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="hive-label" htmlFor="pf-skills">
                  Skills
                </label>
                <input
                  id="pf-skills"
                  className="hive-input"
                  placeholder="React, Python, Figma"
                  value={form.skills}
                  onChange={(e) => handleChange("skills", e.target.value)}
                />
                <div className="mt-2 flex min-h-[28px] flex-wrap gap-1.5">
                  {splitList(form.skills).map((s, i) => (
                    <span
                      key={`${s}-${i}`}
                      className="rounded-full border border-black bg-[#ffda3d] px-2.5 py-1 text-[10px] font-bold"
                    >
                      {s}
                    </span>
                  ))}
                  {splitList(form.skills).length === 0 && (
                    <span className="text-[10px] text-gray-400">
                      Separate each skill with a comma.
                    </span>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="hive-label" htmlFor="pf-interests">
                  Interests
                </label>
                <input
                  id="pf-interests"
                  className="hive-input"
                  placeholder="Web development, AI, UI/UX"
                  value={form.interests}
                  onChange={(e) => handleChange("interests", e.target.value)}
                />
                <div className="mt-2 flex min-h-[28px] flex-wrap gap-1.5">
                  {splitList(form.interests).map((s, i) => (
                    <span
                      key={`${s}-${i}`}
                      className="rounded-full border border-black bg-[#fff8d6] px-2.5 py-1 text-[10px] font-semibold"
                    >
                      {s}
                    </span>
                  ))}
                  {splitList(form.interests).length === 0 && (
                    <span className="text-[10px] text-gray-400">
                      Separate each interest with a comma.
                    </span>
                  )}
                </div>
              </div>
            </form>

            {/* footer */}
            <div className="flex items-center justify-between gap-3 border-t-2 border-black bg-[#fffdf5] px-6 py-4">
              <span className="hidden text-[10px] text-gray-400 sm:block">
                Tip: press Esc to close
              </span>

              <div className="ml-auto flex gap-3">
                <button
                  type="button"
                  onClick={closeEditor}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg border border-black bg-white px-4 py-2.5 text-xs font-bold transition hover:bg-gray-100 disabled:opacity-60"
                >
                  <X size={14} /> Cancel
                </button>

                <button
                  type="submit"
                  form="edit-profile-form"
                  disabled={saving}
                  className="hive-button disabled:opacity-60"
                >
                  <Save size={14} />
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}