"use client";

import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";

import {
  ArrowUpRight,
  Ban,
  CalendarDays,
  Check,
  Clock,
  FileText,
  Users,
  X,
  Inbox,
  Send,
  GraduationCap,
  Info,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useProfile } from "@/hooks/useProfile";
import { createClient } from "@/lib/supabase/client";

import type {
  Application,
  ApplicationStatus,
} from "@/types/application";

const MAX_ACTIVE_APPLICATIONS = 5;

const ACTIVE_TEAM_ERROR =
  "This applicant is already part of another active team.";

// Create one stable browser client for this module.
const supabase = createClient();

type TeamRow = {
  id: string;
  hackathon_id: string;
  university: string;
  name: string;
  description: string;
  max_team_size: number;
  required_skills: string[];
  recruitment_deadline: string;
  created_by: string;
};

type HackathonRow = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
};

type MembershipRow = {
  team_id: string;
};

type ApplicantProfile = {
  id: string;
  full_name: string;
  university: string;
  skills: string[];
  avatar_url: string | null;
};

type Tab = "my-applications" | "received";

type DisplayApplicationStatus =
  | ApplicationStatus
  | "cannot-join";

/* ---------- helpers ---------- */

function formatDate(date: string) {
  if (!date) return "Not specified";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Use local calendar date to compare with PostgreSQL DATE values.
function getTodayDateString() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getStatusStyle(status: DisplayApplicationStatus) {
  switch (status) {
    case "pending":
      return "border-yellow-500 bg-yellow-100 text-yellow-800";

    case "accepted":
      return "border-green-500 bg-green-100 text-green-800";

    case "rejected":
      return "border-red-500 bg-red-100 text-red-800";

    case "withdrawn":
      return "border-gray-400 bg-gray-100 text-gray-600";

    case "cannot-join":
      return "border-orange-500 bg-orange-100 text-orange-800";

    default:
      return "border-gray-400 bg-gray-100 text-gray-600";
  }
}

const STATUS_META: Record<
  DisplayApplicationStatus,
  { fill: string; Icon: LucideIcon }
> = {
  pending: { fill: "#ffda3d", Icon: Clock },
  accepted: { fill: "#86efac", Icon: Check },
  rejected: { fill: "#fca5a5", Icon: X },
  withdrawn: { fill: "#e5e7eb", Icon: Ban },
  "cannot-join": { fill: "#fdba74", Icon: Info },
};

const HEX_CLIP: CSSProperties = {
  clipPath: "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)",
};

// Hexagon with a black outline.
function Hex({
  size,
  fill,
  children,
}: {
  size: number;
  fill: string;
  children?: ReactNode;
}) {
  return (
    <span
      className="inline-block shrink-0 bg-black p-[2.5px]"
      style={{ ...HEX_CLIP, width: size, height: size * 1.08 }}
    >
      <span
        className="flex h-full w-full items-center justify-center"
        style={{ ...HEX_CLIP, background: fill }}
      >
        {children}
      </span>
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: DisplayApplicationStatus;
}) {
  const label =
    status === "cannot-join"
      ? "Cannot Join Another Team"
      : status;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-extrabold capitalize ${getStatusStyle(
        status
      )}`}
    >
      {label}
    </span>
  );
}

function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white px-5 py-10 text-center">
      <div className="mx-auto flex w-fit text-gray-400">{icon}</div>
      <h3 className="hive-heading mt-3 text-xl">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-gray-500">{text}</p>
      {action}
    </div>
  );
}

const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-[#ffda3d] px-4 py-2.5 text-sm font-extrabold shadow-[3px_3px_0px_#000] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-white px-4 py-2.5 text-sm font-extrabold transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50";

/* ---------- page ---------- */

export default function ApplicationsPage() {
  const { profile, loading: profileLoading } = useProfile();

  const profileId = profile?.id;

  const [activeTab, setActiveTab] = useState<Tab>("my-applications");

  const [applications, setApplications] = useState<Application[]>([]);
  const [receivedApplications, setReceivedApplications] = useState<
    Application[]
  >([]);

  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [hackathons, setHackathons] = useState<HackathonRow[]>([]);
  const [applicantProfiles, setApplicantProfiles] = useState<
    ApplicantProfile[]
  >([]);

  // IDs of teams in which the current user has an active membership.
  const [activeTeamIds, setActiveTeamIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Inline feedback for an individual received application.
  const [applicationFeedback, setApplicationFeedback] = useState<{
    applicationId: string;
    message: string;
  } | null>(null);

  // Load all application-related information from Supabase.
  useEffect(() => {
    let cancelled = false;

    async function loadPageData() {
      if (profileLoading) return;

      if (!profileId) {
        setLoading(false);
        setError("Please log in to view your applications.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [
          applicationsResult,
          teamsResult,
          hackathonsResult,
          receivedResult,
          membershipsResult,
        ] = await Promise.all([
          // Applications submitted by the current student.
          supabase
            .from("applications")
            .select(
              "id, team_id, hackathon_id, applicant_id, status, created_at, updated_at"
            )
            .eq("applicant_id", profileId)
            .order("created_at", { ascending: false }),

          // Teams and their details.
          supabase
            .from("teams")
            .select(
              "id, hackathon_id, university, name, description, max_team_size, required_skills, recruitment_deadline, created_by"
            ),

          // Hackathon information.
          supabase
            .from("hackathons")
            .select("id, title, start_date, end_date"),

          // Applicant information for teams created by this user.
          supabase.rpc("get_applicants_for_my_teams"),

          // Memberships belonging to the logged-in student.
          // The existing RLS policy allows users to view their own memberships.
          supabase
            .from("team_members")
            .select("team_id")
            .eq("user_id", profileId),
        ]);

        if (applicationsResult.error) throw applicationsResult.error;
        if (teamsResult.error) throw teamsResult.error;
        if (hackathonsResult.error) throw hackathonsResult.error;
        if (receivedResult.error) throw receivedResult.error;
        if (membershipsResult.error) throw membershipsResult.error;

        const myApplicationRows: Application[] = (
          applicationsResult.data ?? []
        ).map((application) => ({
          id: application.id,
          teamId: application.team_id,
          hackathonId: application.hackathon_id,
          applicantId: application.applicant_id,
          status: application.status as ApplicationStatus,
          createdAt: application.created_at,
          updatedAt: application.updated_at,
        }));

        const teamRows = (teamsResult.data ?? []) as TeamRow[];

        const hackathonRows = (hackathonsResult.data ??
          []) as HackathonRow[];

        const membershipRows = (membershipsResult.data ??
          []) as MembershipRow[];

        // Determine which existing memberships are still active.
        const today = getTodayDateString();

        const activeMembershipTeamIds = membershipRows
          .filter((membership) => {
            const team = teamRows.find(
              (item) => item.id === membership.team_id
            );

            if (!team) return false;

            const hackathon = hackathonRows.find(
              (item) => item.id === team.hackathon_id
            );

            return Boolean(
              hackathon && hackathon.end_date >= today
            );
          })
          .map((membership) => membership.team_id);

        // The RPC returns only pending/accepted applications
        // for teams created by the logged-in user.
        const receivedRows = receivedResult.data ?? [];

        const receivedApplicationRows: Application[] = receivedRows.map(
          (application) => ({
            id: application.application_id,
            teamId: application.team_id,
            hackathonId: application.hackathon_id,
            applicantId: application.applicant_id,
            status: application.status as ApplicationStatus,
            createdAt: application.applied_at,
            updatedAt: application.applied_at,
          })
        );

        // Applicant information comes from the secure RPC,
        // not from a direct query to the profiles table.
        const profiles: ApplicantProfile[] = receivedRows.map(
          (application) => ({
            id: application.applicant_id,
            full_name: application.full_name,
            university: application.university,
            skills: application.skills ?? [],
            avatar_url: application.avatar_url,
          })
        );

        if (cancelled) return;

        setApplications(myApplicationRows);
        setReceivedApplications(receivedApplicationRows);
        setTeams(teamRows);
        setHackathons(hackathonRows);
        setApplicantProfiles(profiles);
        setActiveTeamIds(activeMembershipTeamIds);
      } catch (err) {
        console.error("Applications page error:", err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load applications."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPageData();

    return () => {
      cancelled = true;
    };
  }, [profileId, profileLoading]);

  // Applications submitted by the current user.
  const myApplications = applications;

  // Number of pending + accepted applications.
  const activeApplicationsCount = myApplications.filter(
    (application) =>
      application.status === "pending" ||
      application.status === "accepted"
  ).length;

  // Number of applications waiting for the creator's response.
  const pendingReceivedCount = receivedApplications.filter(
    (application) => application.status === "pending"
  ).length;

  // Teams created by the currently logged-in user.
  const myCreatedTeams = teams.filter(
    (team) => team.created_by === profileId
  );

  function getTeam(teamId: string) {
    return teams.find((team) => team.id === teamId);
  }

  function getHackathon(hackathonId: string) {
    return hackathons.find(
      (hackathon) => hackathon.id === hackathonId
    );
  }

  function getApplicant(applicantId: string) {
    return applicantProfiles.find(
      (applicant) => applicant.id === applicantId
    );
  }

  // A pending application cannot be accepted if the student
  // already belongs to another active team.
  function hasActiveMembershipInAnotherTeam(teamId: string) {
    return activeTeamIds.some(
      (activeTeamId) => activeTeamId !== teamId
    );
  }

  // Update application status directly in Supabase.
  async function changeStatus(
    applicationId: string,
    status: ApplicationStatus
  ) {
    if (isUpdating) return;

    setIsUpdating(applicationId);
    setError("");
    setApplicationFeedback(null);

    try {
      const { error: updateError } = await supabase
        .from("applications")
        .update({ status })
        .eq("id", applicationId);

      if (updateError) throw updateError;

      // Update the applicant's own application list.
      setApplications((previous) =>
        previous.map((application) =>
          application.id === applicationId
            ? {
                ...application,
                status,
                updatedAt: new Date().toISOString(),
              }
            : application
        )
      );

      // Update the creator's received application list.
      if (status === "rejected" || status === "withdrawn") {
        setReceivedApplications((previous) =>
          previous.filter(
            (application) => application.id !== applicationId
          )
        );
      } else {
        setReceivedApplications((previous) =>
          previous.map((application) =>
            application.id === applicationId
              ? {
                  ...application,
                  status,
                  updatedAt: new Date().toISOString(),
                }
              : application
          )
        );
      }
    } catch (err) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "message" in err &&
        typeof err.message === "string"
          ? err.message
          : "Unable to update this application. Please try again.";

      if (message.includes(ACTIVE_TEAM_ERROR)) {
        // Expected restriction: show inline feedback without console logging.
        // The application remains pending in the database.
        setApplicationFeedback({
          applicationId,
          message:
            "This applicant is already part of another active team. They can join your team after that hackathon ends.",
        });
      } else {
        // Log only unexpected errors.
        console.error("Unable to update application:", err);
        setError(message);
      }
    } finally {
      setIsUpdating(null);
    }
  }

  if (profileLoading || loading) {
    return (
      <main className="min-h-screen bg-[#fffdf5] px-5 py-20">
        <div className="mx-auto max-w-5xl rounded-2xl border-2 border-black bg-white p-10 text-center shadow-[4px_4px_0px_#000]">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-[#ffda3d]" />
          <p className="mt-4 font-bold text-gray-600">
            Loading your applications...
          </p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#fffdf5] px-5 py-20">
        <div className="mx-auto max-w-2xl rounded-2xl border-2 border-black bg-white p-8 text-center shadow-[4px_4px_0px_#000]">
          <p className="font-bold text-red-600">
            {error || "Please log in to view your applications."}
          </p>
          <Link
            href="/login"
            className="mt-5 inline-flex rounded-xl border-2 border-black bg-[#ffda3d] px-5 py-3 text-sm font-extrabold"
          >
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffdf5]">
      {/* ================= Hero ================= */}
      <section className="relative overflow-hidden border-b-2 border-black bg-[#ffda3d]">
        {/* Honeycomb background */}
        <svg
          aria-hidden
          className="absolute inset-0 h-full w-full opacity-[0.16]"
        >
          <defs>
            <pattern
              id="apps-comb"
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
          <rect width="100%" height="100%" fill="url(#apps-comb)" />
        </svg>

        <div className="relative mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-x-8 gap-y-6 px-5 py-8 sm:px-8">
          <div className="min-w-0">
            <h1 className="hive-heading text-4xl leading-none sm:text-5xl">
              Applications
            </h1>

            <p className="mt-3 max-w-md text-sm leading-6 text-black/70">
              Your hive&apos;s inbox and outbox: track the teams you&apos;ve
              applied to and answer the ones knocking on your door.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            {/* Application slots */}
            <div className="rounded-2xl border-2 border-black bg-white px-4 py-3 shadow-[4px_4px_0px_#000]">
              <p className="text-xs font-extrabold text-black/60">
                Application slots
              </p>

              <div className="mt-2 flex items-center gap-3">
                <div
                  className="flex -space-x-1"
                  role="img"
                  aria-label={`${activeApplicationsCount} of ${MAX_ACTIVE_APPLICATIONS} slots used`}
                >
                  {Array.from({ length: MAX_ACTIVE_APPLICATIONS }).map(
                    (_, index) => (
                      <Hex
                        key={index}
                        size={26}
                        fill={
                          index < activeApplicationsCount
                            ? "#ffb800"
                            : "#ffffff"
                        }
                      />
                    )
                  )}
                </div>

                <p className="text-2xl font-black leading-none">
                  {activeApplicationsCount}
                  <span className="text-sm text-gray-400">
                    {" "}/ {MAX_ACTIVE_APPLICATIONS}
                  </span>
                </p>
              </div>

              <p className="mt-2 max-w-[220px] text-[11px] leading-4 text-gray-500">
                Pending and accepted applications use up a slot.
              </p>
            </div>

            {/* Pending received */}
            <button
              type="button"
              onClick={() => setActiveTab("received")}
              className="rounded-2xl border-2 border-black bg-white px-4 py-3 text-left shadow-[4px_4px_0px_#000] transition hover:-translate-y-0.5"
            >
              <p className="text-xs font-extrabold text-black/60">
                Waiting on you
              </p>

              <div className="mt-2 flex items-center gap-3">
                <Hex size={34} fill={pendingReceivedCount > 0 ? "#ffb800" : "#ffffff"}>
                  <Inbox size={15} />
                </Hex>

                <p className="text-2xl font-black leading-none">
                  {pendingReceivedCount}
                </p>
              </div>

              <p className="mt-2 max-w-[200px] text-[11px] leading-4 text-gray-500">
                {pendingReceivedCount === 0
                  ? "All caught up. Nothing to review."
                  : pendingReceivedCount === 1
                    ? "Application to review on your teams."
                    : "Applications to review on your teams."}
              </p>
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border-2 border-red-500 bg-red-50 p-4 text-sm font-semibold text-red-700"
          >
            <div className="flex items-center gap-2">
              <Info size={18} className="shrink-0" />
              <p>{error}</p>
            </div>
          </div>
        )}

        <div className="grid items-start gap-8 lg:grid-cols-[1fr_320px]">
          {/* ================= Main column ================= */}
          <div className="min-w-0">
            {/* Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-xl border-2 border-black bg-white p-1 shadow-[3px_3px_0px_#000]">
                <button
                  type="button"
                  onClick={() => setActiveTab("my-applications")}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-extrabold transition ${
                    activeTab === "my-applications"
                      ? "bg-[#ffda3d]"
                      : "hover:bg-yellow-50"
                  }`}
                >
                  <Send size={16} />
                  My applications
                  <span className="rounded-full bg-black px-2 py-0.5 text-xs text-white">
                    {myApplications.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("received")}
                  className={`relative inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-extrabold transition ${
                    activeTab === "received"
                      ? "bg-[#ffda3d]"
                      : "hover:bg-yellow-50"
                  }`}
                >
                  <Inbox size={16} />
                  Received
                  <span className="rounded-full bg-black px-2 py-0.5 text-xs text-white">
                    {receivedApplications.length}
                  </span>

                  {pendingReceivedCount > 0 && activeTab !== "received" && (
                    <span
                      title={`${pendingReceivedCount} pending`}
                      className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-black bg-red-500"
                    />
                  )}
                </button>
              </div>

              <p className="text-xs font-semibold text-gray-500">
                {activeTab === "my-applications"
                  ? "Track your status and withdraw pending applications."
                  : "Review applicants and decide who joins your team."}
              </p>
            </div>

            {/* ---------- My applications ---------- */}
            {activeTab === "my-applications" && (
              <section className="mt-5">
                {myApplications.length === 0 ? (
                  <EmptyState
                    icon={<FileText size={36} />}
                    title="No applications yet"
                    text="Your hive is quiet. Find a team that matches your skills and apply to join!"
                    action={
                      <Link
                        href="/hackathons"
                        className={`${primaryButton} mt-5`}
                      >
                        Explore hackathons
                      </Link>
                    }
                  />
                ) : (
                  <div className="flex flex-col gap-4">
                    {myApplications.map((application) => {
                      const team = getTeam(application.teamId);
                      const hackathon = getHackathon(
                        application.hackathonId
                      );

                      const cannotJoinAnotherTeam =
                        application.status === "pending" &&
                        hasActiveMembershipInAnotherTeam(
                          application.teamId
                        );

                      const displayStatus: DisplayApplicationStatus =
                        cannotJoinAnotherTeam
                          ? "cannot-join"
                          : application.status;

                      const meta =
                        STATUS_META[displayStatus] ?? STATUS_META.withdrawn;

                      return (
                        <article
                          key={application.id}
                          className="rounded-2xl border-2 border-black bg-white p-4 shadow-[4px_4px_0px_#000] sm:p-5"
                        >
                          <div className="flex gap-4">
                            <Hex size={46} fill={meta.fill}>
                              <meta.Icon size={19} strokeWidth={2.5} />
                            </Hex>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-extrabold text-[#a47b00]">
                                    {hackathon?.title ?? "Hackathon"}
                                  </p>

                                  <h3 className="hive-heading text-xl leading-tight">
                                    {team?.name ??
                                      "Team no longer available"}
                                  </h3>
                                </div>

                                <StatusBadge status={displayStatus} />
                              </div>

                              <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                                <GraduationCap size={14} />
                                {team?.university ??
                                  "University not available"}
                              </p>

                              <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600">
                                {team?.description ??
                                  "Team information is currently unavailable."}
                              </p>

                              {cannotJoinAnotherTeam && (
                                <div className="mt-3 flex items-start gap-3 rounded-xl border-2 border-orange-300 bg-orange-50 p-3 text-sm text-orange-900">
                                  <Info
                                    size={18}
                                    className="mt-0.5 shrink-0"
                                  />
                                  <p className="leading-6">
                                    You have already joined another active
                                    team. You cannot join another team
                                    until that hackathon ends.
                                  </p>
                                </div>
                              )}

                              {application.status === "accepted" && (
                                <div className="mt-3 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-bold text-green-800">
                                  <Check size={17} />
                                  You are a member of this team.
                                </div>
                              )}

                              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-gray-300 pt-3">
                                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-semibold text-gray-500">
                                  <span className="flex items-center gap-1.5">
                                    <CalendarDays size={14} />
                                    Applied{" "}
                                    {formatDate(application.createdAt)}
                                  </span>

                                  {hackathon && (
                                    <span className="flex items-center gap-1.5">
                                      <Clock size={14} />
                                      Starts{" "}
                                      {formatDate(hackathon.start_date)}
                                    </span>
                                  )}

                                  {team && (
                                    <span className="flex items-center gap-1.5">
                                      <Users size={14} />
                                      Max {team.max_team_size} members
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  {hackathon && (
                                    <Link
                                      href={`/hackathons/${hackathon.id}`}
                                      className="inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-white px-3 py-2 text-xs font-extrabold hover:bg-yellow-50"
                                    >
                                      View hackathon
                                    </Link>
                                  )}

                                  {application.status === "pending" && (
                                    <button
                                      type="button"
                                      disabled={
                                        isUpdating === application.id
                                      }
                                      onClick={() =>
                                        changeStatus(
                                          application.id,
                                          "withdrawn"
                                        )
                                      }
                                      className="inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-white px-3 py-2 text-xs font-extrabold hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      <X size={14} />
                                      {isUpdating === application.id
                                        ? "Withdrawing..."
                                        : "Withdraw"}
                                    </button>
                                  )}

                                  {/* Accepted applicants can enter the team workspace. */}
                                  {application.status === "accepted" &&
                                    team && (
                                      <Link
                                        href={`/hackathons/${application.hackathonId}/teams/${application.teamId}`}
                                        className="inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-[#ffda3d] px-3 py-2 text-xs font-extrabold shadow-[2px_2px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                                      >
                                        Go to Team
                                        <ArrowUpRight size={14} />
                                      </Link>
                                    )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* ---------- Received applications ---------- */}
            {activeTab === "received" && (
              <section className="mt-5">
                {receivedApplications.length === 0 ? (
                  <EmptyState
                    icon={<Users size={36} />}
                    title="No buzz yet"
                    text="When students apply to your teams, their applications will land here."
                  />
                ) : (
                  <div className="flex flex-col gap-4">
                    {receivedApplications.map((application) => {
                      const team = getTeam(application.teamId);
                      const hackathon = getHackathon(
                        application.hackathonId
                      );
                      const applicant = getApplicant(
                        application.applicantId
                      );

                      return (
                        <article
                          key={application.id}
                          className="rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0px_#000]"
                        >
                          {/* Context strip */}
                          <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-[14px] border-b-2 border-black bg-[#fffdf5] px-4 py-2.5 sm:px-5">
                            <p className="min-w-0 truncate text-sm">
                              <span className="text-gray-500">
                                Applied to{" "}
                              </span>
                              <span className="hive-heading text-base">
                                {team?.name ?? "Your team"}
                              </span>
                              <span className="text-gray-500">
                                {" "}in {hackathon?.title ?? "Hackathon"}
                              </span>
                            </p>

                            <StatusBadge status={application.status} />
                          </div>

                          <div className="flex flex-wrap items-start justify-between gap-4 p-4 sm:p-5">
                            {/* Applicant */}
                            <div className="flex min-w-0 flex-1 basis-72 gap-3">
                              {applicant?.avatar_url ? (
                                <Image
                                  src={applicant.avatar_url}
                                  alt={applicant.full_name}
                                  width={48}
                                  height={48}
                                  className="h-12 w-12 shrink-0 rounded-full border-2 border-black object-cover"
                                />
                              ) : (
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-black bg-[#ffda3d] text-lg font-black">
                                  {applicant?.full_name
                                    ?.charAt(0)
                                    ?.toUpperCase() ?? "?"}
                                </div>
                              )}

                              <div className="min-w-0">
                                <h4 className="font-extrabold">
                                  {applicant?.full_name ??
                                    "Applicant profile unavailable"}
                                </h4>

                                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <GraduationCap size={14} />
                                    {applicant?.university ??
                                      "University not available"}
                                  </span>

                                  <span className="flex items-center gap-1">
                                    <CalendarDays size={14} />
                                    Applied{" "}
                                    {formatDate(application.createdAt)}
                                  </span>
                                </p>

                                <div className="mt-2.5 flex flex-wrap gap-1.5">
                                  {applicant?.skills?.length ? (
                                    applicant.skills.map((skill) => (
                                      <span
                                        key={skill}
                                        className="rounded-full border border-black bg-[#fff8d6] px-2.5 py-0.5 text-xs font-bold"
                                      >
                                        {skill}
                                      </span>
                                    ))
                                  ) : (
                                    <p className="text-xs text-gray-500">
                                      No skills added to profile.
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            {application.status === "pending" && (
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  disabled={isUpdating === application.id}
                                  onClick={() =>
                                    changeStatus(application.id, "accepted")
                                  }
                                  className={primaryButton}
                                >
                                  <Check size={16} />
                                  {isUpdating === application.id
                                    ? "Updating..."
                                    : "Accept"}
                                </button>

                                <button
                                  type="button"
                                  disabled={isUpdating === application.id}
                                  onClick={() =>
                                    changeStatus(application.id, "rejected")
                                  }
                                  className={secondaryButton}
                                >
                                  <X size={16} />
                                  Reject
                                </button>
                              </div>
                            )}

                            {application.status === "accepted" && (
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-xs font-bold text-green-800">
                                  <Check size={16} />
                                  Accepted
                                </div>

                                {team && (
                                  <Link
                                    href={`/hackathons/${application.hackathonId}/teams/${application.teamId}`}
                                    className={primaryButton}
                                  >
                                    Go to Team
                                    <ArrowUpRight size={16} />
                                  </Link>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Active-team restriction feedback for this applicant. */}
                          {applicationFeedback?.applicationId ===
                            application.id && (
                            <div
                              role="alert"
                              className="mx-4 mb-4 flex items-start gap-3 rounded-xl border-2 border-orange-300 bg-orange-50 p-3 text-sm text-orange-900 sm:mx-5 sm:mb-5"
                            >
                              <Info
                                size={18}
                                className="mt-0.5 shrink-0"
                              />
                              <p className="leading-6">
                                {applicationFeedback.message}
                              </p>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </div>

          {/* ================= Sidebar: teams I created ================= */}
          <aside className="lg:sticky lg:top-24">
            <div className="rounded-2xl border-2 border-black bg-white p-4 shadow-[4px_4px_0px_#000]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Users size={20} />
                  <h2 className="hive-heading text-xl">Your teams</h2>
                </div>

                <span className="rounded-full border-2 border-black bg-[#ffda3d] px-2.5 py-0.5 text-xs font-extrabold">
                  {myCreatedTeams.length}
                </span>
              </div>

              <p className="mt-1 text-xs text-gray-500">
                Jump into the workspace of any team you&apos;ve created.
              </p>

              {myCreatedTeams.length === 0 ? (
                <div className="mt-4 rounded-xl border-2 border-dashed border-gray-300 p-4 text-center">
                  <p className="text-sm font-bold text-[#223141]">
                    No teams yet
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Create a team from a hackathon and it will show up here.
                  </p>
                  <Link
                    href="/hackathons"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-[#ffda3d] px-3 py-2 text-xs font-extrabold"
                  >
                    Explore hackathons
                    <ArrowUpRight size={14} />
                  </Link>
                </div>
              ) : (
                <ul className="mt-4 flex flex-col gap-3">
                  {myCreatedTeams.map((team) => {
                    const hackathon = getHackathon(team.hackathon_id);

                    return (
                      <li
                        key={team.id}
                        className="rounded-xl border-2 border-black bg-[#fffdf5] p-3"
                      >
                        <p className="truncate text-xs font-extrabold text-[#a47b00]">
                          {hackathon?.title ?? "Hackathon"}
                        </p>

                        <h3 className="hive-heading mt-0.5 text-lg leading-tight">
                          {team.name}
                        </h3>

                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-gray-500">
                          <span className="flex items-center gap-1">
                            <GraduationCap size={13} />
                            {team.university}
                          </span>

                          <span className="flex items-center gap-1">
                            <Users size={13} />
                            Max {team.max_team_size}
                          </span>

                          {hackathon && (
                            <span className="flex items-center gap-1">
                              <CalendarDays size={13} />
                              {formatDate(hackathon.start_date)}
                            </span>
                          )}
                        </p>

                        <Link
                          href={`/hackathons/${team.hackathon_id}/teams/${team.id}`}
                          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-black bg-[#ffda3d] px-3 py-2 text-xs font-extrabold shadow-[2px_2px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                        >
                          Go to Team
                          <ArrowUpRight size={14} />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}