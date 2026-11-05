"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  MapPin,
  Plus,
  Timer,
  Users,
} from "lucide-react";

import type { Hackathon } from "@/types/hackathon";
import type { Team } from "@/types/team";
import type { Application, ApplicationStatus } from "@/types/application";

import { useProfile } from "@/hooks/useProfile";
import { sortTeamsByMatch } from "@/lib/matching";
import TeamCard from "@/components/teams/TeamCard";
import { createClient } from "@/lib/supabase/client";

interface HackathonDetailsProps {
  hackathon: Hackathon;
  teams: Team[];
}

/* ---------- helpers ---------- */

function parseDate(date: string) {
  if (!date) return null;
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(date: string) {
  const parsed = parseDate(date);
  if (!parsed) return "Not specified";

  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getDurationDays(start: string, end: string) {
  const s = parseDate(start);
  const e = parseDate(end);
  if (!s || !e) return null;

  const days = Math.round((e.getTime() - s.getTime()) / 86_400_000) + 1;
  return days > 0 ? days : null;
}

function scrollToTeams() {
  document
    .getElementById("teams-for-hackathon")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ---------- page ---------- */

export default function HackathonDetails({
  hackathon,
  teams,
}: HackathonDetailsProps) {
  const router = useRouter();
  const supabase = createClient();

  const {
    profile,
    loading: profileLoading,
    error: profileError,
  } = useProfile();

  const [applications, setApplications] = useState<Application[]>([]);
  const [applyError, setApplyError] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  const profileId = profile?.id;

  const hasCreatedTeamInHackathon = Boolean(
    profileId && teams.some((team) => team.createdBy === profileId)
  );

  // Load this student's applications from Supabase.
  useEffect(() => {
    let isMounted = true;

    async function loadApplications() {
      if (!profileId) {
        if (isMounted) setApplications([]);
        return;
      }

      const { data, error } = await supabase
        .from("applications")
        .select(
          "id, team_id, hackathon_id, applicant_id, status, created_at, updated_at"
        )
        .eq("applicant_id", profileId);

      if (!isMounted) return;

      if (error) {
        console.error("Error loading applications:", error.message);
        setApplyError("Unable to load your applications. Please refresh.");
        return;
      }

      const formattedApplications: Application[] = (data ?? []).map(
        (application) => ({
          id: application.id,
          teamId: application.team_id,
          hackathonId: application.hackathon_id,
          applicantId: application.applicant_id,
          status: application.status as ApplicationStatus,
          createdAt: application.created_at,
          updatedAt: application.updated_at,
        })
      );

      setApplications(formattedApplications);
    }

    loadApplications();

    return () => {
      isMounted = false;
    };
  }, [profileId, supabase]);

  // Calculate skill matches.
  const rankedTeams = profile
    ? sortTeamsByMatch(teams, profile.skills ?? [])
    : [];

  async function handleApply(team: Team) {
    if (isApplying) return;

    if (!profileId) {
      setApplyError("Please log in to apply to a team.");
      return;
    }

    // A team creator cannot apply to another team
    // under the same hackathon.
    const alreadyCreatedTeam = teams.some(
      (existingTeam) => existingTeam.createdBy === profileId
    );

    if (alreadyCreatedTeam) {
      setApplyError(
        "You have already created a team for this hackathon. You cannot apply to another team."
      );
      return;
    }

    // Prevent another application if one already exists.
    const alreadyApplied = applications.some(
      (application) => application.teamId === team.id
    );

    if (alreadyApplied) {
      setApplyError("You have already applied to this team.");
      return;
    }

    // Check the active application limit before sending the request.
    const activeApplications = applications.filter(
      (application) =>
        application.status === "pending" || application.status === "accepted"
    );

    if (activeApplications.length >= 5) {
      setApplyError(
        "You have reached the maximum limit of 5 active applications."
      );
      return;
    }

    setApplyError("");
    setIsApplying(true);

    try {
      const { data, error } = await supabase
        .from("applications")
        .insert({
          team_id: team.id,
          hackathon_id: hackathon.id,
        })
        .select(
          "id, team_id, hackathon_id, applicant_id, status, created_at, updated_at"
        )
        .single();

      if (error) {
        throw new Error(error.message);
      }

      const newApplication: Application = {
        id: data.id,
        teamId: data.team_id,
        hackathonId: data.hackathon_id,
        applicantId: data.applicant_id,
        status: data.status as ApplicationStatus,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setApplications((previous) => [...previous, newApplication]);

      router.push("/applications");
    } catch (error) {
      console.error("Application submission error:", error);

      setApplyError(
        error instanceof Error
          ? error.message
          : "Something went wrong while applying."
      );
    } finally {
      setIsApplying(false);
    }
  }

  const duration = getDurationDays(hackathon.startDate, hackathon.endDate);

  return (
    <main className="min-h-screen bg-[#fffdf5]">
      {/* Hero */}
      <section className="relative overflow-hidden border-b-2 border-black bg-[#ffda3d]">
        {/* Honeycomb background */}
        <svg
          aria-hidden
          className="absolute inset-0 h-full w-full opacity-[0.18]"
        >
          <defs>
            <pattern
              id="hero-comb"
              width="56"
              height="97"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M28 0 L56 16 L56 48 L28 64 L0 48 L0 16 Z M28 64 L28 97 M56 48 L84 64 M0 48 L-28 64"
                fill="none"
                stroke="#000"
                strokeWidth="2"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-comb)" />
        </svg>

        <div className="relative mx-auto max-w-[1100px] px-5 py-7 sm:px-8">
          <Link
            href="/hackathons"
            className="mb-5 inline-flex items-center gap-2 text-sm font-bold hover:underline"
          >
            <ArrowLeft size={16} />
            Back to hackathons
          </Link>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border-2 border-black bg-white px-3 py-0.5 text-xs font-extrabold uppercase">
              {hackathon.domain}
            </span>

            <span className="rounded-full border-2 border-black bg-white px-3 py-0.5 text-xs font-extrabold uppercase">
              {hackathon.mode}
            </span>

          </div>

          <h1 className="hive-heading max-w-xl text-3xl leading-[1.1] sm:text-4xl md:text-[2.6rem]">
            {hackathon.title}
          </h1>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold">
            <span className="flex items-center gap-2">
              <MapPin size={16} />
              {hackathon.location}
            </span>

            <span className="flex items-center gap-2">
              <CalendarDays size={16} />
              {formatDate(hackathon.startDate)} – {formatDate(hackathon.endDate)}
            </span>

            {duration && (
              <span className="flex items-center gap-2">
                <Timer size={16} />
                {duration} {duration === 1 ? "day" : "days"}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={scrollToTeams}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border-2 border-black bg-white px-4 py-2 text-sm font-extrabold shadow-[3px_3px_0px_#000] transition hover:-translate-y-0.5"
          >
            <Users size={16} />
            Find your team
          </button>
        </div>
      </section>

      <div className="mx-auto max-w-[1100px] px-5 py-10 sm:px-8">
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_340px]">
          {/* About */}
          <section className="rounded-2xl border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000] sm:p-8">
            <h2 className="hive-heading text-2xl">About this hackathon</h2>

            <p className="mt-5 max-w-[68ch] whitespace-pre-wrap text-sm leading-7 text-gray-600">
              {hackathon.description}
            </p>
          </section>

          {/* Registration */}
          <aside className="rounded-2xl border-2 border-black bg-[#ffda3d] p-6 shadow-[4px_4px_0px_#000] lg:sticky lg:top-24">
            <h2 className="hive-heading text-2xl">Join the action.</h2>

            <p className="mt-3 text-sm leading-6 text-black/70">
              Register for this hackathon and turn your ideas into something
              amazing.
            </p>

            <a
              href={hackathon.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-black bg-white px-4 py-3 text-sm font-extrabold text-black shadow-[3px_3px_0px_#000] transition hover:-translate-y-1"
            >
              Register now
              <ArrowUpRight size={17} />
            </a>

            <div className="mt-5 border-t-2 border-black/20 pt-4">
              <p className="text-xs font-bold text-black/60">
                REGISTRATION DEADLINE
              </p>
              <p className="mt-1 font-extrabold">
                {formatDate(hackathon.applicationDeadline)}
              </p>
            </div>
          </aside>
        </div>

        {/* Teams */}
        <section id="teams-for-hackathon" className="mt-14 scroll-mt-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="hive-heading text-3xl sm:text-4xl">
                Teams for this hackathon
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Discover teams ranked by how well your skills match their
                requirements.
              </p>
            </div>

            <Link
              href={`/hackathons/${hackathon.id}/teams/create`}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-black bg-[#ffda3d] px-5 py-3 text-sm font-extrabold shadow-[3px_3px_0px_#000] transition hover:-translate-y-1"
            >
              <Plus size={17} />
              Create a team
            </Link>
          </div>

          {teams.length === 0 ? (
            <div className="mt-8 rounded-2xl border-2 border-dashed border-gray-300 bg-white px-5 py-14 text-center">
              <Users size={38} className="mx-auto text-gray-400" />

              <h3 className="hive-heading mt-4 text-xl">No teams yet!</h3>

              <p className="mt-2 text-sm text-gray-500">
                Be the first to create a team for this hackathon.
              </p>

              <Link
                href={`/hackathons/${hackathon.id}/teams/create`}
                className="mt-5 inline-flex items-center gap-2 rounded-lg border-2 border-black bg-[#ffda3d] px-4 py-2 text-sm font-extrabold"
              >
                <Plus size={16} />
                Create the first team
              </Link>
            </div>
          ) : profileLoading ? (
            <div className="mt-8 rounded-2xl border-2 border-black bg-white p-8 text-center shadow-[3px_3px_0px_#000]">
              <p className="font-bold text-gray-500">
                Calculating your skill matches...
              </p>
            </div>
          ) : profileError || !profile ? (
            <div className="mt-8 rounded-2xl border-2 border-black bg-white p-8 text-center">
              <p className="font-bold text-red-600">
                Unable to load your profile skills.
              </p>
              <p className="mt-2 text-sm text-gray-500">
                {profileError ||
                  "Please complete your profile to see team matches."}
              </p>
            </div>
          ) : (
            <div className="mt-8 flex flex-col gap-5">
              {applyError && (
                <div className="rounded-xl border-2 border-red-500 bg-red-50 p-4 text-sm font-semibold text-red-700">
                  {applyError}
                </div>
              )}

              {rankedTeams.map((team) => {
                const hasApplied = applications.some(
                  (application) => application.teamId === team.id
                );

                return (
                  <TeamCard
                    key={team.id}
                    team={team}
                    currentUserId={profile.id}
                    hasApplied={hasApplied}
                    hasCreatedTeamInHackathon={hasCreatedTeamInHackathon}
                    onApply={handleApply}
                  />
                );
              })}

              {isApplying && (
                <p className="text-center text-sm font-bold text-gray-500">
                  Submitting your application...
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}