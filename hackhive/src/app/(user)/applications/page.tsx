
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import {
  ArrowLeft,
  ArrowUpRight,
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
      {/* Header */}
      <section className="border-b-2 border-black bg-[#ffda3d]">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
          <Link
            href="/hackathons"
            className="mb-7 inline-flex items-center gap-2 text-sm font-bold hover:underline"
          >
            <ArrowLeft size={17} />
            Back to hackathons
          </Link>

          <p className="text-xs font-black uppercase tracking-widest">
            Your HackHive activity
          </p>

          <h1 className="hive-heading mt-2 text-4xl sm:text-5xl">
            Applications
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-black/70">
            Keep track of the teams you're applying to and manage the
            applications you receive from other students.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
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

        {/* Application summary */}
        <section className="mb-8 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-gray-500">
                  Active applications
                </p>
                <p className="mt-2 text-3xl font-black">
                  {activeApplicationsCount}
                  <span className="text-lg text-gray-400">
                    {" "}/ {MAX_ACTIVE_APPLICATIONS}
                  </span>
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ffda3d]">
                <Send size={23} />
              </div>
            </div>

            <div className="mt-5 h-3 overflow-hidden rounded-full border border-black bg-gray-100">
              <div
                className="h-full rounded-full bg-[#ffda3d] transition-all"
                style={{
                  width: `${Math.min(
                    (activeApplicationsCount / MAX_ACTIVE_APPLICATIONS) *
                      100,
                    100
                  )}%`,
                }}
              />
            </div>

            <p className="mt-2 text-xs text-gray-500">
              Pending and accepted applications count toward your limit.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-gray-500">
                  Pending received
                </p>
                <p className="mt-2 text-3xl font-black">
                  {pendingReceivedCount}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ffda3d]">
                <Inbox size={23} />
              </div>
            </div>

            <p className="mt-5 text-xs text-gray-500">
              Applications waiting for your response on teams you created.
            </p>
          </div>
        </section>

        {/* Teams Created By Me */}
        <section className="mb-10">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Users size={23} />
                <h2 className="hive-heading text-2xl">
                  Teams You've Created
                </h2>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Open the workspace for any team you've created.
              </p>
            </div>

            <span className="rounded-full border-2 border-black bg-[#ffda3d] px-3 py-1 text-xs font-extrabold">
              {myCreatedTeams.length}{" "}
              {myCreatedTeams.length === 1 ? "team" : "teams"}
            </span>
          </div>

          {myCreatedTeams.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white p-7 text-center">
              <Users size={34} className="mx-auto text-gray-400" />
              <p className="mt-3 font-bold text-[#223141]">
                You haven't created any teams yet.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Create a team from a hackathon to see it here.
              </p>
              <Link
                href="/hackathons"
                className="mt-5 inline-flex items-center gap-2 rounded-xl border-2 border-black bg-[#ffda3d] px-5 py-3 text-sm font-extrabold shadow-[3px_3px_0px_#000] hover:-translate-y-0.5"
              >
                Explore hackathons
                <ArrowUpRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {myCreatedTeams.map((team) => {
                const hackathon = getHackathon(team.hackathon_id);

                return (
                  <article
                    key={team.id}
                    className="rounded-2xl border-2 border-black bg-white p-5 shadow-[4px_4px_0px_#000] transition-transform hover:-translate-y-1"
                  >
                    <p className="text-xs font-black uppercase tracking-wider text-[#a47b00]">
                      {hackathon?.title ?? "Hackathon"}
                    </p>

                    <h3 className="hive-heading mt-2 text-xl">
                      {team.name}
                    </h3>

                    <p className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                      <GraduationCap size={17} />
                      {team.university}
                    </p>

                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-600">
                      {team.description ||
                        "No team description provided."}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        Max {team.max_team_size} members
                      </span>

                      {hackathon && (
                        <span className="flex items-center gap-1">
                          <CalendarDays size={14} />
                          {formatDate(hackathon.start_date)}
                        </span>
                      )}
                    </div>

                    <div className="mt-5 border-t border-gray-200 pt-4">
                      <Link
                        href={`/hackathons/${team.hackathon_id}/teams/${team.id}`}
                        className="inline-flex items-center gap-2 rounded-xl border-2 border-black bg-[#ffda3d] px-5 py-3 text-sm font-extrabold shadow-[3px_3px_0px_#000] transition-transform hover:-translate-y-0.5"
                      >
                        Go to Team
                        <ArrowUpRight size={17} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Tabs */}
        <div className="mb-8 flex flex-wrap gap-3 border-b-2 border-black pb-4">
          <button
            type="button"
            onClick={() => setActiveTab("my-applications")}
            className={`inline-flex items-center gap-2 rounded-xl border-2 border-black px-5 py-3 text-sm font-extrabold transition ${
              activeTab === "my-applications"
                ? "bg-[#ffda3d] shadow-[3px_3px_0px_#000]"
                : "bg-white hover:bg-yellow-50"
            }`}
          >
            <Send size={17} />
            My applications
            <span className="rounded-full bg-black px-2 py-0.5 text-xs text-white">
              {myApplications.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("received")}
            className={`inline-flex items-center gap-2 rounded-xl border-2 border-black px-5 py-3 text-sm font-extrabold transition ${
              activeTab === "received"
                ? "bg-[#ffda3d] shadow-[3px_3px_0px_#000]"
                : "bg-white hover:bg-yellow-50"
            }`}
          >
            <Inbox size={17} />
            Received applications
            <span className="rounded-full bg-black px-2 py-0.5 text-xs text-white">
              {receivedApplications.length}
            </span>
          </button>
        </div>

        {/* My applications */}
        {activeTab === "my-applications" && (
          <section>
            <div className="mb-6">
              <h2 className="hive-heading text-2xl">
                Teams you've applied to
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Track your application status and withdraw pending
                applications.
              </p>
            </div>

            {myApplications.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white px-5 py-16 text-center">
                <FileText
                  size={42}
                  className="mx-auto text-gray-400"
                />
                <h3 className="hive-heading mt-4 text-xl">
                  No applications yet
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Find a team that matches your skills and apply to join!
                </p>
                <Link
                  href="/hackathons"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl border-2 border-black bg-[#ffda3d] px-5 py-3 text-sm font-extrabold shadow-[3px_3px_0px_#000]"
                >
                  Explore hackathons
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {myApplications.map((application) => {
                  const team = getTeam(application.teamId);
                  const hackathon = getHackathon(application.hackathonId);

                  const cannotJoinAnotherTeam =
                    application.status === "pending" &&
                    hasActiveMembershipInAnotherTeam(application.teamId);

                  const displayStatus: DisplayApplicationStatus =
                    cannotJoinAnotherTeam
                      ? "cannot-join"
                      : application.status;

                  return (
                    <article
                      key={application.id}
                      className="rounded-2xl border-2 border-black bg-white p-5 shadow-[4px_4px_0px_#000] sm:p-6"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-black uppercase tracking-wider text-[#a47b00]">
                            {hackathon?.title ?? "Hackathon"}
                          </p>

                          <h3 className="hive-heading mt-2 text-xl">
                            {team?.name ?? "Team no longer available"}
                          </h3>

                          <p className="mt-2 text-sm text-gray-500">
                            {team?.university ?? "University not available"}
                          </p>
                        </div>

                        <StatusBadge status={displayStatus} />
                      </div>

                      <p className="mt-4 text-sm leading-6 text-gray-600">
                        {team?.description ??
                          "Team information is currently unavailable."}
                      </p>

                      {cannotJoinAnotherTeam && (
                        <div className="mt-4 flex items-start gap-3 rounded-xl border-2 border-orange-300 bg-orange-50 p-4 text-sm text-orange-900">
                          <Info
                            size={19}
                            className="mt-0.5 shrink-0"
                          />
                          <p className="leading-6">
                            You have already joined another active team.
                            You cannot join another team until that
                            hackathon ends.
                          </p>
                        </div>
                      )}

                      {application.status === "accepted" && (
                        <div className="mt-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-bold text-green-800">
                          <Check size={17} />
                          You are a member of this team.
                        </div>
                      )}

                      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-gray-500">
                        <span className="flex items-center gap-2">
                          <CalendarDays size={15} />
                          Applied {formatDate(application.createdAt)}
                        </span>

                        {hackathon && (
                          <span className="flex items-center gap-2">
                            <Clock size={15} />
                            Hackathon: {formatDate(hackathon.start_date)}
                          </span>
                        )}

                        {team && (
                          <span className="flex items-center gap-2">
                            <Users size={15} />
                            Max {team.max_team_size} members
                          </span>
                        )}
                      </div>

                      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-gray-200 pt-5">
                        {hackathon && (
                          <Link
                            href={`/hackathons/${hackathon.id}`}
                            className="inline-flex items-center gap-2 rounded-lg border-2 border-black bg-[#ffda3d] px-4 py-2.5 text-xs font-extrabold hover:-translate-y-0.5"
                          >
                            View hackathon
                          </Link>
                        )}

                        {application.status === "pending" && (
                          <button
                            type="button"
                            disabled={isUpdating === application.id}
                            onClick={() =>
                              changeStatus(application.id, "withdrawn")
                            }
                            className="inline-flex items-center gap-2 rounded-lg border-2 border-black bg-white px-4 py-2.5 text-xs font-extrabold hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <X size={15} />
                            {isUpdating === application.id
                              ? "Withdrawing..."
                              : "Withdraw application"}
                          </button>
                        )}

                        {/* Accepted applicants can enter the team workspace. */}
                        {application.status === "accepted" && team && (
                          <Link
                            href={`/hackathons/${application.hackathonId}/teams/${application.teamId}`}
                            className="inline-flex items-center gap-2 rounded-xl border-2 border-black bg-[#ffda3d] px-5 py-3 text-sm font-extrabold shadow-[3px_3px_0px_#000] transition-transform hover:-translate-y-0.5"
                          >
                            Go to Team
                            <ArrowUpRight size={17} />
                          </Link>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Received applications */}
        {activeTab === "received" && (
          <section>
            <div className="mb-6">
              <h2 className="hive-heading text-2xl">
                Applications to your teams
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Review applicants and decide who joins your team.
              </p>
            </div>

            {receivedApplications.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white px-5 py-16 text-center">
                <Users
                  size={42}
                  className="mx-auto text-gray-400"
                />
                <h3 className="hive-heading mt-4 text-xl">
                  No applications received
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  When students apply to your teams, their applications
                  will appear here.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {receivedApplications.map((application) => {
                  const team = getTeam(application.teamId);
                  const hackathon = getHackathon(application.hackathonId);
                  const applicant = getApplicant(application.applicantId);

                  return (
                    <article
                      key={application.id}
                      className="rounded-2xl border-2 border-black bg-white p-5 shadow-[4px_4px_0px_#000] sm:p-6"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-black uppercase tracking-wider text-[#a47b00]">
                            Application for
                          </p>
                          <h3 className="hive-heading mt-2 text-xl">
                            {team?.name ?? "Your team"}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            {hackathon?.title ?? "Hackathon"}
                          </p>
                        </div>

                        <StatusBadge status={application.status} />
                      </div>

                      <div className="mt-6 rounded-xl border-2 border-gray-200 bg-[#fffdf5] p-4">
                        <div className="flex items-center gap-3">
                          {applicant?.avatar_url ? (
                            <Image
                              src={applicant.avatar_url}
                              alt={applicant.full_name}
                              width={48}
                              height={48}
                              className="h-12 w-12 rounded-full border-2 border-black object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-black bg-[#ffda3d] text-lg font-black">
                              {applicant?.full_name
                                ?.charAt(0)
                                ?.toUpperCase() ?? "?"}
                            </div>
                          )}

                          <div>
                            <h4 className="font-extrabold">
                              {applicant?.full_name ??
                                "Applicant profile unavailable"}
                            </h4>
                            <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                              <GraduationCap size={14} />
                              {applicant?.university ??
                                "University not available"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5">
                          <p className="text-xs font-black uppercase tracking-wider text-gray-500">
                            Skills
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2">
                            {applicant?.skills?.length ? (
                              applicant.skills.map((skill) => (
                                <span
                                  key={skill}
                                  className="rounded-full border border-black bg-white px-3 py-1 text-xs font-bold"
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

                      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-500">
                        <CalendarDays size={14} />
                        Applied {formatDate(application.createdAt)}
                      </div>

                      {/* Active-team restriction feedback for this applicant. */}
                      {applicationFeedback?.applicationId === application.id && (
                        <div
                          role="alert"
                          className="mt-4 flex items-start gap-3 rounded-xl border-2 border-orange-300 bg-orange-50 p-4 text-sm text-orange-900"
                        >
                          <Info
                            size={19}
                            className="mt-0.5 shrink-0"
                          />
                          <p className="leading-6">
                            {applicationFeedback.message}
                          </p>
                        </div>
                      )}

                      {application.status === "pending" && (
                        <div className="mt-6 flex flex-wrap gap-3 border-t border-gray-200 pt-5">
                          <button
                            type="button"
                            disabled={isUpdating === application.id}
                            onClick={() =>
                              changeStatus(application.id, "accepted")
                            }
                            className="inline-flex items-center gap-2 rounded-xl border-2 border-black bg-[#ffda3d] px-5 py-3 text-sm font-extrabold shadow-[3px_3px_0px_#000] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Check size={17} />
                            {isUpdating === application.id
                              ? "Updating..."
                              : "Accept application"}
                          </button>

                          <button
                            type="button"
                            disabled={isUpdating === application.id}
                            onClick={() =>
                              changeStatus(application.id, "rejected")
                            }
                            className="inline-flex items-center gap-2 rounded-xl border-2 border-black bg-white px-5 py-3 text-sm font-extrabold hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <X size={17} />
                            Reject
                          </button>
                        </div>
                      )}

                      {application.status === "accepted" && (
                        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-gray-200 pt-5">
                          <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm font-bold text-green-800">
                            <Check size={17} />
                            This applicant has been accepted.
                          </div>

                          {team && (
                            <Link
                              href={`/hackathons/${application.hackathonId}/teams/${application.teamId}`}
                              className="inline-flex items-center gap-2 rounded-xl border-2 border-black bg-[#ffda3d] px-5 py-3 text-sm font-extrabold shadow-[3px_3px_0px_#000] transition-transform hover:-translate-y-0.5"
                            >
                              Go to Team
                              <ArrowUpRight size={17} />
                            </Link>
                          )}
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
    </main>
  );
}
