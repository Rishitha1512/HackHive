
"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  Globe,
  MessageCircle,
  X,
  Trophy,
  Building2,
} from "lucide-react";

import TeamMemberList, {
  type TeamMember,
} from "@/components/teams/TeamMemberList";

import TeamChat from "@/components/teams/TeamChat";

interface TeamWorkspaceProps {
  hackathonId: string;

  team: {
    id: string;
    name: string;
    description: string;
    university: string;
    maxTeamSize: number;
    requiredSkills: string[];
    recruitmentDeadline: string;
  };

  hackathon: {
    title: string;
    domain: string;
    description: string;
    mode: string;
    location: string;
    startDate: string;
    endDate: string;
    organizer: string;
  };

  members: TeamMember[];
}

export default function TeamWorkspace({
  hackathonId,
  team,
  hackathon,
  members,
}: TeamWorkspaceProps) {
  const [chatOpen, setChatOpen] = useState(false);

  const formatDate = (date: string) => {
    if (!date) return "Not specified";

    return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <main className="min-h-screen bg-[#fffdf5] px-4 py-8 text-[#223141] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        {/* Back navigation */}
        <Link
          href={`/hackathons/${hackathonId}`}
          className="mb-7 inline-flex items-center gap-2 font-bold text-[#223141] transition hover:gap-3"
        >
          <ArrowLeft size={19} />
          Back to Hackathon
        </Link>

        {/* Page heading */}
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border-2 border-[#223141] bg-[#ffda3d] px-3 py-1.5 text-xs font-black uppercase tracking-wide">
            <Trophy size={14} />
            Team Workspace
          </div>

          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Welcome to your hive!
            <span className="ml-2">🐝</span>
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
            Your team's space to connect, collaborate, and prepare for
            the hackathon.
          </p>
        </div>

        {/* Hackathon overview */}
        <section className="mb-7 overflow-hidden rounded-2xl border-2 border-[#223141] bg-[#ffda3d] shadow-[5px_5px_0px_#223141]">
          <div className="p-5 sm:p-7">
            <div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
              <Trophy size={17} />
              Hackathon
            </div>

            <h2 className="text-2xl font-black sm:text-3xl">
              {hackathon.title}
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#223141]/80">
              {hackathon.description || "No hackathon description available."}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <InfoItem
                icon={<CalendarDays size={17} />}
                label="Starts"
                value={formatDate(hackathon.startDate)}
              />

              <InfoItem
                icon={<Clock size={17} />}
                label="Ends"
                value={formatDate(hackathon.endDate)}
              />

              <InfoItem
                icon={<MapPin size={17} />}
                label="Location"
                value={hackathon.location || "Not specified"}
              />

              <InfoItem
                icon={<Globe size={17} />}
                label="Mode"
                value={hackathon.mode || "Not specified"}
              />
            </div>
          </div>
        </section>

        {/* Team overview */}
        <section className="mb-7 rounded-2xl border-2 border-[#223141] bg-white p-5 shadow-[5px_5px_0px_#223141] sm:p-7">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-wider text-gray-500">
                Your Team
              </p>

              <h2 className="text-2xl font-black sm:text-3xl">
                {team.name}
              </h2>
            </div>

            <span className="rounded-full border-2 border-[#223141] bg-[#ffda3d] px-3 py-1.5 text-xs font-black">
              {team.maxTeamSize} MAX MEMBERS
            </span>
          </div>

          <p className="max-w-3xl whitespace-pre-wrap text-sm leading-7 text-gray-600">
            {team.description || "No team description added yet."}
          </p>

          <div className="mt-6 grid gap-4 border-t border-gray-200 pt-5 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff3b0]">
                <Building2 size={19} />
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500">
                  University
                </p>

                <p className="mt-1 font-bold">
                  {team.university || "Not specified"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff3b0]">
                <CalendarDays size={19} />
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500">
                  Recruitment deadline
                </p>

                <p className="mt-1 font-bold">
                  {formatDate(team.recruitmentDeadline)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-3 text-sm font-bold">
              Skills we're looking for
            </p>

            {team.requiredSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {team.requiredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border-2 border-[#223141] bg-[#fff3b0] px-3 py-1.5 text-xs font-bold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No specific skills listed.
              </p>
            )}
          </div>
        </section>

        {/* Team members */}
        <div className="mb-7">
          <TeamMemberList members={members} />
        </div>

        {/* Collaboration section */}
        <section className="rounded-2xl border-2 border-dashed border-[#223141]/40 bg-[#fff8d9] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-[#223141] bg-[#ffda3d]">
              <MessageCircle size={21} />
            </div>

            <div>
              <h2 className="font-black">Team collaboration</h2>

              <p className="mt-1 text-sm leading-6 text-gray-600">
                Your private team chat is ready! Open Team Chat to
                communicate with your teammates. Messages are saved
                and will be available whenever you revisit this workspace.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Floating chat button */}
      <button
        type="button"
        onClick={() => setChatOpen((open) => !open)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border-2 border-[#223141] bg-[#ffda3d] px-5 py-3 font-black shadow-[4px_4px_0px_#223141] transition hover:-translate-y-1 hover:shadow-[5px_5px_0px_#223141]"
      >
        {chatOpen ? <X size={20} /> : <MessageCircle size={20} />}
        Team Chat
      </button>

      {/* Real-time team chat panel */}
      {chatOpen && (
        <div className="fixed bottom-24 right-4 z-40 flex h-[430px] w-[calc(100%-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border-2 border-[#223141] bg-white shadow-[6px_6px_0px_#223141] sm:right-6">
          <div className="flex shrink-0 items-center justify-between border-b-2 border-[#223141] bg-[#ffda3d] px-4 py-4">
            <div>
              <h3 className="font-black">Team Chat</h3>

              <p className="text-xs font-medium text-[#223141]/70">
                {team.name}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setChatOpen(false)}
              aria-label="Close team chat"
              className="rounded-lg p-1 transition hover:bg-black/10"
            >
              <X size={20} />
            </button>
          </div>

          <TeamChat teamId={team.id} members={members} />
        </div>
      )}
    </main>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-[#223141]/20 bg-white/60 p-3">
      <div className="mt-0.5">{icon}</div>

      <div className="min-w-0">
        <p className="text-xs font-semibold text-[#223141]/60">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-bold">
          {value}
        </p>
      </div>
    </div>
  );
}
