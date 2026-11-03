"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  Edit3,
  ExternalLink,
  GraduationCap,
  MapPin,
  Save,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";

const participatedHackathons = [
  {
    id: 1,
    name: "CodeSprint 2026",
    university: "ABC University",
    date: "August 12–14, 2026",
    result: "Finalist",
    color: "bg-[#fff0ae]",
  },
  {
    id: 2,
    name: "InnovateX",
    university: "XYZ Institute",
    date: "June 20–21, 2026",
    result: "Participant",
    color: "bg-[#e8edff]",
  },
];

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();

  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    university: "",
    location: "",
    bio: "",
    skills: "",
    interests: "",
    githubOrPortfolio: "",
    profilePicture: "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName,
        university: user.university,
        location: user.location,
        bio: user.bio,
        skills: user.skills.join(", "),
        interests: user.interests.join(", "),
        githubOrPortfolio: user.githubOrPortfolio,
        profilePicture: user.profilePicture,
      });
    }
  }, [user]);

  if (!user) return null;

  const handleChange = (field: string, value: string) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSave = () => {
    updateProfile({
      fullName: form.fullName.trim(),
      university: form.university.trim(),
      location: form.location.trim(),
      bio: form.bio.trim(),
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
    });

    setEditing(false);
  };

  const completionFields = [
    user.fullName,
    user.university,
    user.location,
    user.bio,
    user.skills.length > 0,
    user.interests.length > 0,
    user.githubOrPortfolio,
  ];

  const completion = Math.round(
    (completionFields.filter(Boolean).length / completionFields.length) * 100
  );

  return (
    <main className="mx-auto max-w-[1280px] px-5 py-8 sm:px-8 lg:py-12">
      {/* WELCOME SECTION */}

      <section className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-3 text-[10px] font-black tracking-[3px] text-[#b48600]">
            YOUR HIVE, YOUR JOURNEY
          </p>

          <h1 className="hive-heading text-4xl sm:text-5xl">
            Hey, {user.fullName.split(" ")[0]}!{" "}
            <span className="inline-block">🐝</span>
          </h1>

          <p className="mt-3 text-sm text-gray-500">
            Your next great collaboration starts here.
          </p>
        </div>

        <Link href="/hackathons" className="hive-button w-fit">
          Explore hackathons <ArrowRight size={16} />
        </Link>
      </section>

      {/* PROFILE COMPLETION */}

      <section className="mb-8 grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="rounded-2xl border border-black bg-[#ffda3d] p-6 sm:p-8">
          <div className="flex items-center gap-2 text-xs font-black tracking-wider">
            <Sparkles size={17} />
            YOUR PROFILE
          </div>

          <h2 className="hive-heading mt-4 text-3xl sm:text-4xl">
            Let the hive know you.
          </h2>

          <p className="mt-2 max-w-lg text-sm text-[#514515]">
            A complete profile helps you find teammates whose skills
            complement yours.
          </p>

          <div className="mt-7">
            <div className="mb-2 flex items-center justify-between text-xs font-bold">
              <span>Profile completion</span>
              <span>{completion}%</span>
            </div>

            <div className="h-2.5 overflow-hidden rounded-full border border-black bg-white/70">
              <div
                className="h-full rounded-full bg-black transition-all"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-black bg-white p-6">
          <div>
            <p className="text-xs font-black tracking-wider text-gray-500">
              READY TO BUILD?
            </p>

            <h3 className="hive-heading mt-3 text-3xl">
              Find your next team.
            </h3>

            <p className="mt-3 text-xs leading-5 text-gray-500">
              Discover hackathons and teams that match your skills.
            </p>
          </div>

          <Link
            href="/hackathons"
            className="mt-6 flex items-center justify-between rounded-xl bg-black px-4 py-3 text-xs font-bold text-white hover:bg-[#333]"
          >
            Discover teams <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>

      {/* PROFILE DETAILS */}

      <section className="mb-10">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black tracking-[2px] text-[#b48600]">
              ABOUT YOU
            </p>

            <h2 className="hive-heading mt-1 text-3xl">
              Your profile
            </h2>
          </div>

          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 rounded-lg border border-black bg-white px-4 py-2.5 text-xs font-bold hover:bg-[#ffda3d]"
            >
              <Edit3 size={14} />
              Edit profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setForm({
                    fullName: user.fullName,
                    university: user.university,
                    location: user.location,
                    bio: user.bio,
                    skills: user.skills.join(", "),
                    interests: user.interests.join(", "),
                    githubOrPortfolio: user.githubOrPortfolio,
                    profilePicture: user.profilePicture,
                  });
                  setEditing(false);
                }}
                className="flex items-center gap-2 rounded-lg border border-black bg-white px-3 py-2 text-xs font-bold"
              >
                <X size={14} /> Cancel
              </button>

              <button onClick={handleSave} className="hive-button">
                <Save size={14} /> Save changes
              </button>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* LEFT PROFILE CARD */}

          <div className="h-fit rounded-2xl border border-black bg-white p-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-black bg-[#ffda3d] text-3xl font-black">
                {user.profilePicture ? (
                  <Image
                    src={user.profilePicture}
                    alt={user.fullName}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  user.fullName.charAt(0).toUpperCase()
                )}
              </div>

              <h3 className="mt-4 text-xl font-black">
                {user.fullName}
              </h3>

              <p className="mt-1 text-xs text-gray-500">{user.email}</p>

              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#fff2bf] px-3 py-1.5 text-[10px] font-bold">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Student member
              </div>
            </div>

            <div className="mt-6 space-y-4 border-t border-gray-100 pt-5">
              <div className="flex items-center gap-3 text-xs">
                <GraduationCap size={17} className="text-[#b48600]" />
                <span>{user.university || "University not added"}</span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <MapPin size={17} className="text-[#b48600]" />
                <span>{user.location || "Location not added"}</span>
              </div>

              {user.githubOrPortfolio && (
                <a
                  href={user.githubOrPortfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 break-all text-xs hover:underline"
                >
                  <ExternalLink size={17} className="shrink-0 text-[#b48600]" />
                  GitHub / Portfolio
                </a>
              )}
            </div>
          </div>

          {/* RIGHT PROFILE FORM */}

          <div className="rounded-2xl border border-black bg-white p-6 sm:p-8">
            <div className="mb-6">
              <h3 className="text-sm font-black">Personal information</h3>
              <p className="mt-1 text-xs text-gray-500">
                Tell other builders a little about yourself.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="hive-label">Full name</label>
                {editing ? (
                  <input
                    className="hive-input"
                    value={form.fullName}
                    onChange={(e) =>
                      handleChange("fullName", e.target.value)
                    }
                  />
                ) : (
                  <p className="text-sm font-semibold">{user.fullName}</p>
                )}
              </div>

              <div>
                <label className="hive-label">University</label>
                {editing ? (
                  <input
                    className="hive-input"
                    value={form.university}
                    onChange={(e) =>
                      handleChange("university", e.target.value)
                    }
                  />
                ) : (
                  <p className="text-sm font-semibold">{user.university}</p>
                )}
              </div>

              <div>
                <label className="hive-label">Location</label>
                {editing ? (
                  <input
                    className="hive-input"
                    value={form.location}
                    onChange={(e) =>
                      handleChange("location", e.target.value)
                    }
                  />
                ) : (
                  <p className="text-sm font-semibold">{user.location}</p>
                )}
              </div>

              <div>
                <label className="hive-label">Email</label>
                <p className="text-sm font-semibold">{user.email}</p>
              </div>

              <div className="sm:col-span-2">
                <label className="hive-label">Bio</label>

                {editing ? (
                  <textarea
                    rows={3}
                    className="hive-input resize-none"
                    placeholder="Tell us about yourself..."
                    value={form.bio}
                    onChange={(e) =>
                      handleChange("bio", e.target.value)
                    }
                  />
                ) : (
                  <p className="text-sm leading-6 text-gray-600">
                    {user.bio || "No bio added yet."}
                  </p>
                )}
              </div>

              {editing && (
                <div className="sm:col-span-2">
                  <label className="hive-label">Profile picture URL</label>
                  <input
                    type="url"
                    className="hive-input"
                    placeholder="https://example.com/photo.jpg"
                    value={form.profilePicture}
                    onChange={(e) =>
                      handleChange("profilePicture", e.target.value)
                    }
                  />
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="hive-label">GitHub / Portfolio URL</label>

                {editing ? (
                  <input
                    type="url"
                    className="hive-input"
                    value={form.githubOrPortfolio}
                    onChange={(e) =>
                      handleChange("githubOrPortfolio", e.target.value)
                    }
                  />
                ) : (
                  <p className="break-all text-sm font-semibold">
                    {user.githubOrPortfolio || "Not added"}
                  </p>
                )}
              </div>
            </div>

            <div className="my-7 border-t border-gray-100" />

            {/* SKILLS */}

            <div>
              <h3 className="mb-3 text-sm font-black">My skills</h3>

              {editing ? (
                <input
                  className="hive-input"
                  placeholder="React, Python, Figma"
                  value={form.skills}
                  onChange={(e) =>
                    handleChange("skills", e.target.value)
                  }
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-black bg-[#fff0ae] px-3 py-1.5 text-xs font-bold"
                    >
                      {skill}
                    </span>
                  ))}

                  {user.skills.length === 0 && (
                    <p className="text-xs text-gray-400">
                      No skills added yet.
                    </p>
                  )}
                </div>
              )}

              {editing && (
                <p className="mt-2 text-[10px] text-gray-400">
                  Separate each skill with a comma.
                </p>
              )}
            </div>

            <div className="my-7 border-t border-gray-100" />

            {/* INTERESTS */}

            <div>
              <h3 className="mb-3 text-sm font-black">My interests</h3>

              {editing ? (
                <input
                  className="hive-input"
                  placeholder="Web development, AI, UI/UX"
                  value={form.interests}
                  onChange={(e) =>
                    handleChange("interests", e.target.value)
                  }
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {user.interests.map((interest) => (
                    <span
                      key={interest}
                      className="rounded-full border border-[#ddd] bg-[#f8f7f2] px-3 py-1.5 text-xs"
                    >
                      {interest}
                    </span>
                  ))}

                  {user.interests.length === 0 && (
                    <p className="text-xs text-gray-400">
                      No interests added yet.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* PREVIOUS HACKATHONS */}

      <section className="mb-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-black tracking-[2px] text-[#b48600]">
              YOUR JOURNEY SO FAR
            </p>

            <h2 className="hive-heading mt-1 text-3xl sm:text-4xl">
              Participated hackathons
            </h2>
          </div>

          <span className="hidden rounded-full bg-[#fff0ae] px-3 py-1.5 text-xs font-bold sm:block">
            {participatedHackathons.length} events
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {participatedHackathons.map((hackathon) => (
            <div
              key={hackathon.id}
              className={`rounded-2xl border border-black p-6 ${hackathon.color}`}
            >
              <div className="mb-5 flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-black bg-white">
                  <Trophy size={21} />
                </div>

                <span className="rounded-full border border-black bg-white px-3 py-1 text-[10px] font-bold">
                  {hackathon.result}
                </span>
              </div>

              <h3 className="text-xl font-black">{hackathon.name}</h3>

              <p className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                <GraduationCap size={14} />
                {hackathon.university}
              </p>

              <p className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                <CalendarDays size={14} />
                {hackathon.date}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-4 text-[11px] text-gray-400">
          These are sample events for the frontend preview. Real
          participation history will come from the backend later.
        </p>
      </section>

      {/* BOTTOM CTA */}

      <section className="flex flex-col justify-between gap-5 rounded-2xl border border-black bg-[#ffda3d] p-7 sm:flex-row sm:items-center sm:p-9">
        <div>
          <h2 className="hive-heading text-3xl sm:text-4xl">
            Ready for your next challenge?
          </h2>

          <p className="mt-2 text-xs text-[#514515]">
            Your next team, your next idea, your next big achievement.
          </p>
        </div>

        <Link href="/hackathons" className="hive-button hive-button-black w-fit">
          Explore hackathons <ArrowRight size={16} />
        </Link>
      </section>
    </main>
  );
}