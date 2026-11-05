"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock,
  MapPin,
  Globe,
  MessageCircle,
  Trophy,
  Building2,
  Users,
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

const DAY = 86_400_000;

function useNow() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  return now;
}

export default function TeamWorkspace({
  hackathonId,
  team,
  hackathon,
  members,
}: TeamWorkspaceProps) {
  const [tab, setTab] = useState<"hive" | "chat">("chat");
  const [showFullDesc, setShowFullDesc] = useState(false);
  const now = useNow();

  const formatDate = (date: string) => {
    if (!date) return "Not specified";

    return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  /* ---------- Hackathon countdown ---------- */
  const countdown = useMemo(() => {
    if (now === null || !hackathon.startDate || !hackathon.endDate) return null;

    const start = new Date(`${hackathon.startDate}T00:00:00`).getTime();
    const end = new Date(`${hackathon.endDate}T23:59:59`).getTime();
    if (Number.isNaN(start) || Number.isNaN(end)) return null;

    if (now > end) return { phase: "ended" as const, d: 0, h: 0, m: 0 };

    const phase = now < start ? ("upcoming" as const) : ("live" as const);
    const diff = (phase === "upcoming" ? start : end) - now;

    return {
      phase,
      d: Math.floor(diff / DAY),
      h: Math.floor((diff % DAY) / 3_600_000),
      m: Math.floor((diff % 3_600_000) / 60_000),
    };
  }, [now, hackathon.startDate, hackathon.endDate]);

  /* ---------- Recruitment deadline ---------- */
  const deadlineLabel = useMemo(() => {
    if (now === null || !team.recruitmentDeadline) return null;

    const end = new Date(`${team.recruitmentDeadline}T23:59:59`).getTime();
    if (Number.isNaN(end)) return null;

    if (end < now) return { text: "Closed", open: false };

    const days = Math.ceil((end - now) / DAY);
    return {
      text: days <= 1 ? "Last day" : `${days} days left`,
      open: true,
    };
  }, [now, team.recruitmentDeadline]);

  /* ---------- Which required skills the team already covers ---------- */
  const memberSkills = useMemo(
    () =>
      new Set(
        members.flatMap((member) =>
          member.skills.map((skill) => skill.trim().toLowerCase())
        )
      ),
    [members]
  );

  const coveredCount = team.requiredSkills.filter((skill) =>
    memberSkills.has(skill.trim().toLowerCase())
  ).length;

  const description =
    hackathon.description || "No hackathon description available.";
  const longDescription = description.length > 180;

  return (
    <main className="min-h-screen bg-[#fffdf5] px-4 py-5 text-[#0e141b] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Top row: back + heading */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link
              href={`/hackathons/${hackathonId}`}
              className="inline-flex items-center gap-2 text-sm font-bold transition hover:gap-3"
            >
              <ArrowLeft size={18} />
              Back to Hackathon
            </Link>

            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#0e141b] bg-[#ffda3d] px-3 py-1 text-xs font-black">
              <Trophy size={13} />
              Team Workspace
            </span>
          </div>

          <p className="text-sm text-gray-600">
            Your team&apos;s space to connect, collaborate, and prepare for the
            hackathon.
          </p>
        </div>

        {/* Hackathon banner */}
        <section className="mb-5 overflow-hidden rounded-2xl border-2 border-[#0e141b] bg-[#ffda3d] shadow-[5px_5px_0px_#0e141b]">
          <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="min-w-0">
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                Welcome to your hive! <span>🐝</span>
              </h1>

              <p className="mt-1 flex items-center gap-1.5 text-sm font-bold">
                <Trophy size={15} className="shrink-0" />
                <span className="truncate">{hackathon.title}</span>
              </p>

              <p
                className={`mt-2 max-w-3xl text-sm leading-6 text-[#0e141b]/80 ${
                  showFullDesc ? "" : "line-clamp-2"
                }`}
              >
                {description}
              </p>

              {longDescription && (
                <button
                  type="button"
                  onClick={() => setShowFullDesc((v) => !v)}
                  className="mt-1 text-xs font-black underline underline-offset-2"
                >
                  {showFullDesc ? "Show less" : "Read more"}
                </button>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <Chip icon={<CalendarDays size={14} />}>
                  {formatDate(hackathon.startDate)}
                </Chip>
                <Chip icon={<Clock size={14} />}>
                  {formatDate(hackathon.endDate)}
                </Chip>
                <Chip icon={<MapPin size={14} />}>
                  {hackathon.location || "Not specified"}
                </Chip>
                <Chip icon={<Globe size={14} />}>
                  {hackathon.mode || "Not specified"}
                </Chip>
              </div>
            </div>

            {/* Live countdown */}
            {countdown && (
              <div className="rounded-xl border-2 border-[#0e141b] bg-[#0e141b] p-3 text-[#ffda3d]">
                <p className="mb-2 text-center text-xs font-bold text-[#fff3b0]">
                  {countdown.phase === "upcoming" && "Hackathon starts in"}
                  {countdown.phase === "live" && "Live now · ends in"}
                  {countdown.phase === "ended" && "This hackathon has ended"}
                </p>

                {countdown.phase !== "ended" && (
                  <div className="flex items-stretch justify-center gap-2">
                    <Tile value={countdown.d} label="days" />
                    <Tile value={countdown.h} label="hrs" />
                    <Tile value={countdown.m} label="min" />
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Mobile tab switcher */}
        <div className="sticky top-2 z-30 mb-4 grid grid-cols-2 gap-1 rounded-full border-2 border-[#0e141b] bg-white p-1 shadow-[3px_3px_0px_#0e141b] lg:hidden">
          <TabButton
            active={tab === "hive"}
            onClick={() => setTab("hive")}
            icon={<Users size={16} />}
          >
            Hive
          </TabButton>
          <TabButton
            active={tab === "chat"}
            onClick={() => setTab("chat")}
            icon={<MessageCircle size={16} />}
          >
            Team Chat
          </TabButton>
        </div>

        {/* Main grid: team info left, chat right */}
        <div className="grid gap-5 lg:grid-cols-[minmax(320px,400px)_1fr] lg:items-start">
          {/* LEFT: team + members */}
          <div
            className={`space-y-5 ${tab === "chat" ? "hidden" : "block"} lg:block`}
          >
            {/* Team overview */}
            <section className="rounded-2xl border-2 border-[#0e141b] bg-white p-4 shadow-[4px_4px_0px_#0e141b]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-500">Your team</p>
                  <h2 className="break-words text-2xl font-black leading-tight">
                    {team.name}
                  </h2>
                </div>

                <span className="shrink-0 rounded-full border-2 border-[#0e141b] bg-[#ffda3d] px-2.5 py-1 text-[11px] font-black">
                  {team.maxTeamSize} MAX MEMBERS
                </span>
              </div>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                {team.description || "No team description added yet."}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2.5 rounded-xl bg-[#fff8d9] p-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fff3b0]">
                    <Building2 size={17} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-gray-500">
                      University
                    </p>
                    <p className="truncate text-sm font-bold">
                      {team.university || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 rounded-xl bg-[#fff8d9] p-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fff3b0]">
                    <CalendarDays size={17} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-gray-500">
                      Recruitment deadline
                    </p>
                    <p className="truncate text-sm font-bold">
                      {formatDate(team.recruitmentDeadline)}
                    </p>
                  </div>
                </div>
              </div>

              {deadlineLabel && (
                <p
                  className={`mt-2 inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                    deadlineLabel.open
                      ? "border-[#0e141b] bg-[#ffda3d]"
                      : "border-gray-300 bg-gray-100 text-gray-500"
                  }`}
                >
                  Recruiting: {deadlineLabel.text}
                </p>
              )}

              <div className="mt-4 border-t border-gray-200 pt-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-bold">Skills we&apos;re looking for</p>

                  {team.requiredSkills.length > 0 && (
                    <p className="text-xs font-semibold text-gray-500">
                      {coveredCount}/{team.requiredSkills.length} covered
                    </p>
                  )}
                </div>

                {team.requiredSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {team.requiredSkills.map((skill) => {
                      const covered = memberSkills.has(
                        skill.trim().toLowerCase()
                      );

                      return (
                        <span
                          key={skill}
                          title={
                            covered
                              ? "Someone in your team has this"
                              : "Still needed"
                          }
                          className={`inline-flex items-center gap-1 rounded-full border-2 px-2.5 py-1 text-xs font-bold ${
                            covered
                              ? "border-[#0e141b] bg-[#ffda3d]"
                              : "border-dashed border-[#0e141b]/50 bg-[#fff8d9]"
                          }`}
                        >
                          {covered && <Check size={12} strokeWidth={3} />}
                          {skill}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No specific skills listed.
                  </p>
                )}
              </div>
            </section>

            {/* Team members */}
            <TeamMemberList members={members} maxSize={team.maxTeamSize} />
          </div>

          {/* RIGHT: chat, always docked on desktop */}
          <section
            className={`${
              tab === "hive" ? "hidden" : "block"
            } h-[calc(100dvh-9rem)] min-h-[480px] overflow-hidden rounded-2xl border-2 border-[#0e141b] bg-white shadow-[6px_6px_0px_#0e141b] lg:sticky lg:top-4 lg:block lg:h-[calc(100vh-2.5rem)] lg:min-h-[560px]`}
          >
            <TeamChat
              teamId={team.id}
              members={members}
              teamName={team.name}
              active={tab === "chat"}
            />
          </section>
        </div>
      </div>
    </main>
  );
}

function Chip({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#0e141b]/30 bg-white/70 px-3 py-1 text-xs font-bold">
      {icon}
      <span className="truncate">{children}</span>
    </span>
  );
}

function Tile({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-w-[56px] rounded-lg bg-[#1b2530] px-2 py-1.5 text-center">
      <p className="text-2xl font-black tabular-nums leading-none">
        {String(value).padStart(2, "0")}
      </p>
      <p className="mt-1 text-[10px] font-semibold text-[#fff3b0]">{label}</p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center justify-center gap-2 rounded-full py-2 text-sm font-black transition ${
        active ? "bg-[#ffda3d]" : "bg-transparent hover:bg-[#fff3b0]"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}