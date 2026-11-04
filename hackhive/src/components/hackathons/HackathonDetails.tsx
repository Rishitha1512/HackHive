
"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Clock,
  Globe,
  Mail,
  MapPin,
  Users,
  Plus,
  Building2,
  ExternalLink,
} from "lucide-react";

import type { Hackathon } from "@/types/hackathon";
import type { Team } from "@/types/team";

import { useProfile } from "@/hooks/useProfile";
import { sortTeamsByMatch } from "@/lib/matching";
import TeamCard from "@/components/teams/TeamCard";

interface HackathonDetailsProps {
  hackathon: Hackathon;
  teams: Team[];
}

function formatDate(date: string) {
  if (!date) return "Not specified";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function HackathonDetails({
  hackathon,
  teams,
}: HackathonDetailsProps) {
  const {
    profile,
    loading: profileLoading,
    error: profileError,
  } = useProfile();

  // Calculate skill matches and sort teams from highest to lowest.
  const rankedTeams = profile
    ? sortTeamsByMatch(teams, profile.skills ?? [])
    : [];

  return (
    <main className="min-h-screen bg-[#fffdf5]">
      {/* Yellow hero */}
      <section className="border-b-2 border-black bg-[#ffda3d]">
        <div className="mx-auto max-w-[1100px] px-5 py-10 sm:px-8">
          <Link
            href="/hackathons"
            className="mb-8 inline-flex items-center gap-2 text-sm font-bold hover:underline"
          >
            <ArrowLeft size={17} />
            Back to hackathons
          </Link>

          <div className="mb-5 flex flex-wrap gap-2">
            <span className="rounded-full border-2 border-black bg-white px-3 py-1 text-xs font-extrabold uppercase">
              {hackathon.domain}
            </span>

            <span className="rounded-full border-2 border-black bg-white px-3 py-1 text-xs font-extrabold uppercase">
              {hackathon.mode}
            </span>
          </div>

          <h1 className="hive-heading max-w-3xl text-4xl leading-tight sm:text-6xl">
            {hackathon.title}
          </h1>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold">
            <span className="flex items-center gap-2">
              <MapPin size={17} />
              {hackathon.location}
            </span>

            <span className="flex items-center gap-2">
              <CalendarDays size={17} />
              {formatDate(hackathon.startDate)} – {formatDate(hackathon.endDate)}
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1100px] px-5 py-10 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* Main information */}
          <div className="space-y-8">
            <section className="rounded-2xl border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000] sm:p-8">
              <h2 className="hive-heading text-2xl">
                About this hackathon
              </h2>

              <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-gray-600">
                {hackathon.description}
              </p>
            </section>

            {/* Dates */}
            <section className="rounded-2xl border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000] sm:p-8">
              <h2 className="hive-heading text-2xl">
                Important dates
              </h2>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ffda3d]">
                    <CalendarDays size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500">
                      Start date
                    </p>
                    <p className="mt-1 text-sm font-extrabold">
                      {formatDate(hackathon.startDate)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ffda3d]">
                    <CalendarDays size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500">
                      End date
                    </p>
                    <p className="mt-1 text-sm font-extrabold">
                      {formatDate(hackathon.endDate)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 sm:col-span-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ffda3d]">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500">
                      Registration deadline
                    </p>
                    <p className="mt-1 text-sm font-extrabold">
                      {formatDate(hackathon.applicationDeadline)}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Location */}
            <section className="rounded-2xl border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000] sm:p-8">
              <h2 className="hive-heading text-2xl">
                Location and venue
              </h2>

              <div className="mt-5 flex gap-3">
                <MapPin size={21} className="shrink-0" />
                <div>
                  <p className="text-sm font-extrabold">
                    {hackathon.location}
                  </p>
                  {hackathon.venueDetails && (
                    <p className="mt-2 text-sm leading-6 text-gray-500">
                      {hackathon.venueDetails}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Organiser */}
            <section className="rounded-2xl border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000] sm:p-8">
              <h2 className="hive-heading text-2xl">
                Organiser information
              </h2>

              <div className="mt-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Building2 size={20} />
                  <div>
                    <p className="text-xs font-bold text-gray-500">
                      Organised by
                    </p>
                    <p className="text-sm font-extrabold">
                      {hackathon.organizer}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail size={20} />
                  <div>
                    <p className="text-xs font-bold text-gray-500">
                      Contact email
                    </p>
                    <a
                      href={`mailto:${hackathon.contactEmail}`}
                      className="break-all text-sm font-bold text-blue-700 hover:underline"
                    >
                      {hackathon.contactEmail}
                    </a>
                  </div>
                </div>

                {hackathon.website && (
                  <div className="flex items-center gap-3">
                    <Globe size={20} />
                    <div>
                      <p className="text-xs font-bold text-gray-500">
                        Official website
                      </p>
                      <a
                        href={hackathon.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-sm font-bold text-blue-700 hover:underline"
                      >
                        Visit website <ExternalLink size={13} className="inline" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Registration sidebar */}
          <aside className="h-fit rounded-2xl border-2 border-black bg-[#ffda3d] p-6 shadow-[4px_4px_0px_#000]">
            <p className="text-xs font-black uppercase tracking-widest">
              Ready to participate?
            </p>

            <h2 className="hive-heading mt-3 text-2xl">
              Join the action.
            </h2>

            <p className="mt-3 text-sm leading-6 text-black/70">
              Register for this hackathon and turn your ideas into something
              amazing.
            </p>

            <a
              href={hackathon.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-black bg-white px-4 py-3 text-sm font-extrabold shadow-[3px_3px_0px_#000] transition hover:-translate-y-1"
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

        {/* Teams section */}
        <section className="mt-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#b48600]">
                Find your people
              </p>

              <h2 className="hive-heading mt-2 text-3xl sm:text-4xl">
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

              <h3 className="hive-heading mt-4 text-xl">
                No teams yet!
              </h3>

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
                {profileError || "Please complete your profile to see team matches."}
              </p>
            </div>
          ) : (
            <div className="mt-8 flex flex-col gap-5">
              {rankedTeams.map((team) => (
                <TeamCard key={team.id} team={team} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
