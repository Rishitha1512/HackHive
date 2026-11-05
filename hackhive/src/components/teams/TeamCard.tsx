"use client";

import { useEffect, useId, useState } from "react";
import type { CSSProperties } from "react";

import type { Team } from "@/types/team";
import type { TeamMatch } from "@/lib/matching";
import {
  Check,
  CalendarClock,
  GraduationCap,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";

interface TeamCardProps {
  team: Team & TeamMatch;
  currentUserId: string;
  hasApplied: boolean;
  hasCreatedTeamInHackathon: boolean;
  onApply: (team: Team) => void;
}

/* ---------- helpers ---------- */

function formatDeadline(date: string) {
  if (!date) return "No deadline";
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getTier(score: number) {
  if (score >= 80)
    return { label: "Perfect fit", note: "You have what this team needs." };
  if (score >= 50)
    return { label: "Strong fit", note: "Most of the stack is already yours." };
  if (score > 0)
    return { label: "Stretch pick", note: "A chance to learn on the job." };
  return { label: "New territory", note: "Brand-new skills to pick up." };
}

/* ---------- hexagon pieces ---------- */

// Pointy-top hexagon used by the honey gauge.
const HEX_POINTS = "60,4 116.3,36.5 116.3,101.5 60,134 3.7,101.5 3.7,36.5";
const GAUGE_HEIGHT = 130; // 134 - 4

function HoneyGauge({ score }: { score: number }) {
  const clipId = `hex-${useId().replace(/:/g, "")}`;
  const [filled, setFilled] = useState(false);

  // Honey pours in on mount.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const pct = Math.max(0, Math.min(100, Math.round(score)));
  const offset = filled ? ((100 - pct) / 100) * GAUGE_HEIGHT : GAUGE_HEIGHT;

  return (
    <div className="relative mx-auto h-[138px] w-[120px] shrink-0">
      <svg
        viewBox="0 0 120 138"
        className="h-full w-full drop-shadow-[3px_3px_0px_#000]"
        role="img"
        aria-label={`${pct}% skill match`}
      >
        <defs>
          <clipPath id={clipId}>
            <polygon points={HEX_POINTS} />
          </clipPath>
        </defs>

        {/* empty comb */}
        <polygon points={HEX_POINTS} fill="#fff" />

        {/* honey level */}
        <g clipPath={`url(#${clipId})`}>
          <g
            style={{
              transform: `translateY(${offset}px)`,
              transition: "transform 1100ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
            className="motion-reduce:!transition-none"
          >
            <rect x="0" y="4" width="120" height="140" fill="#ffb800" />
            <rect x="0" y="4" width="120" height="9" fill="#ffda3d" />
          </g>
        </g>

        {/* outline */}
        <polygon
          points={HEX_POINTS}
          fill="none"
          stroke="#000"
          strokeWidth="5"
          strokeLinejoin="round"
        />
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="hive-heading text-[34px] leading-none text-black">
          {pct}
          <span className="text-lg">%</span>
        </span>
        <span className="mt-1 text-[10px] font-extrabold text-black/70">
          skill match
        </span>
      </div>
    </div>
  );
}

const HEX_CLIP = (inset: number): CSSProperties => ({
  clipPath: `polygon(${inset}px 0, calc(100% - ${inset}px) 0, 100% 50%, calc(100% - ${inset}px) 100%, ${inset}px 100%, 0 50%)`,
});

function HexChip({ skill, owned }: { skill: string; owned: boolean }) {
  return (
    <span
      className="inline-block p-[2px]"
      style={{ ...HEX_CLIP(11), background: owned ? "#000" : "#9ca3af" }}
      title={owned ? "You have this skill" : "You don't have this skill yet"}
    >
      <span
        className={`flex items-center gap-1.5 px-4 py-1.5 text-xs ${
          owned ? "font-extrabold text-black" : "font-bold text-gray-500"
        }`}
        style={{
          ...HEX_CLIP(9),
          background: owned
            ? "#ffda3d"
            : "repeating-linear-gradient(135deg, #fff 0 6px, #f3f4f6 6px 12px)",
        }}
      >
        {owned && <Check size={13} strokeWidth={3.5} />}
        {skill}
      </span>
    </span>
  );
}

/* ---------- card ---------- */

export default function TeamCard({
  team,
  currentUserId,
  hasApplied,
  hasCreatedTeamInHackathon,
  onApply,
}: TeamCardProps) {
  const isOwnTeam = team.createdBy === currentUserId;
  const tier = getTier(team.matchScore);

  // Skills you own first, skills to learn after.
  const owned = new Set(team.matchedSkills.map((s) => s.toLowerCase()));
  const skills = [...team.requiredSkills]
    .map((skill) => ({ skill, owned: owned.has(skill.toLowerCase()) }))
    .sort((a, b) => Number(b.owned) - Number(a.owned));

  const seats = Math.min(Math.max(team.maxTeamSize || 0, 0), 8);

  return (
    <article className="relative w-full rounded-2xl border-2 border-black bg-white shadow-[5px_5px_0px_#000] transition-transform hover:-translate-y-1">
      <div className="grid md:grid-cols-[210px_1fr]">
        {/* Left: honey gauge */}
        <div className="relative overflow-hidden rounded-t-[14px] border-b-2 border-black bg-[#ffda3d] px-4 py-6 md:rounded-l-[14px] md:rounded-tr-none md:border-b-0 md:border-r-2">
          {/* faint honeycomb texture */}
          <svg
            aria-hidden
            className="absolute inset-0 h-full w-full opacity-[0.12]"
          >
            <defs>
              <pattern
                id="comb"
                width="28"
                height="48.5"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M14 0 L28 8 L28 24 L14 32 L0 24 L0 8 Z M14 32 L14 48.5 M28 24 L42 32 M0 24 L-14 32"
                  fill="none"
                  stroke="#000"
                  strokeWidth="1.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#comb)" />
          </svg>

          <div className="relative flex items-center gap-5 md:flex-col md:gap-3">
            <HoneyGauge score={team.matchScore} />

            <div className="min-w-0 md:text-center">
              <p className="hive-heading text-xl leading-tight">{tier.label}</p>
              <p className="mt-1 text-xs font-semibold leading-snug text-black/70">
                {tier.note}
              </p>
            </div>
          </div>
        </div>

        {/* Right: details */}
        <div className="flex min-w-0 flex-col p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h3 className="hive-heading min-w-0 text-3xl leading-none text-black">
              {team.name}
            </h3>

            <span className="inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-[#fffdf5] px-2.5 py-1 text-xs font-extrabold text-[#223141]">
              <GraduationCap size={15} />
              {team.university}
            </span>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            {team.description}
          </p>

          {/* Skill comb */}
          <div className="mt-5 rounded-xl border-2 border-dashed border-black/30 bg-[#fffdf5] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-extrabold text-[#223141]">
                Skills they&apos;re buzzing for
              </p>

              <div className="flex items-center gap-3 text-[11px] font-bold text-gray-500">
                <span className="flex items-center gap-1">
                  <span
                    className="h-3 w-3 border border-black bg-[#ffda3d]"
                    style={HEX_CLIP(3)}
                  />
                  You have it
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="h-3 w-3 bg-gray-300"
                    style={HEX_CLIP(3)}
                  />
                  Learn it
                </span>
              </div>
            </div>

            {skills.length === 0 ? (
              <p className="mt-3 text-sm font-semibold text-gray-500">
                No specific skills required. Anyone can join this hive.
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {skills.map(({ skill, owned: isOwned }) => (
                  <HexChip key={skill} skill={skill} owned={isOwned} />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold text-gray-600">
              <span className="flex items-center gap-2">
                <span className="flex -space-x-1.5">
                  {Array.from({ length: seats }).map((_, i) => (
                    <span
                      key={i}
                      className="h-5 w-5 rounded-full border-2 border-black bg-[#ffda3d]"
                    />
                  ))}
                </span>
                Up to {team.maxTeamSize} members
              </span>

              <span className="flex items-center gap-1.5">
                <CalendarClock size={15} />
                Apply by {formatDeadline(team.recruitmentDeadline)}
              </span>
            </div>

            <div className="lg:w-[260px] lg:shrink-0">
              {isOwnTeam ? (
                <button
                  type="button"
                  disabled
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-black bg-gray-100 px-4 py-3 text-sm font-bold text-gray-600"
                >
                  <Users size={18} />
                  Your Team
                </button>
              ) : hasCreatedTeamInHackathon ? (
                <button
                  type="button"
                  disabled
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-black bg-gray-100 px-4 py-3 text-xs font-bold text-gray-500"
                >
                  <ShieldCheck size={18} className="shrink-0" />
                  You already created a team here
                </button>
              ) : hasApplied ? (
                <button
                  type="button"
                  disabled
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-black bg-green-100 px-4 py-3 text-sm font-bold text-green-800"
                >
                  <Check size={18} />
                  Applied
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onApply(team)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-black bg-[#ffda3d] px-4 py-3 text-sm font-extrabold text-[#223141] shadow-[3px_3px_0px_#000] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                >
                  <UserPlus size={18} />
                  Apply to Join
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}