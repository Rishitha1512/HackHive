
import type { Team } from "@/types/team";
import type { TeamMatch } from "@/lib/matching";
import MatchScore from "./MatchScore";
import { Check, UserPlus, Users, ShieldCheck } from "lucide-react";

interface TeamCardProps {
  team: Team & TeamMatch;
  currentUserId: string;
  hasApplied: boolean;
  hasCreatedTeamInHackathon: boolean;
  onApply: (team: Team) => void;
}

export default function TeamCard({
  team,
  currentUserId,
  hasApplied,
  hasCreatedTeamInHackathon,
  onApply,
}: TeamCardProps) {
  const isOwnTeam = team.createdBy === currentUserId;

  return (
    <article className="w-full rounded-2xl border-2 border-black bg-white p-5 shadow-[4px_4px_0px_#000] transition-transform hover:-translate-y-1">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-extrabold text-[#223141]">
            {team.name}
          </h3>

          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            {team.description}
          </p>

          <p className="mt-3 text-sm font-semibold text-gray-700">
            🎓 {team.university}
          </p>
        </div>

        <MatchScore
          matchScore={team.matchScore}
          matchedSkills={team.matchedSkills}
          missingSkills={team.missingSkills}
        />
      </div>

      <div className="mt-5 border-t border-gray-200 pt-4">
        <p className="text-sm font-bold text-[#223141]">
          Required skills
        </p>

        <div className="mt-2 flex flex-wrap gap-2">
          {team.requiredSkills.map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700"
            >
              {skill}
            </span>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <p>
            <span className="font-bold text-green-700">Matched: </span>
            {team.matchedSkills.length}
          </p>

          <p>
            <span className="font-bold text-red-600">Missing: </span>
            {team.missingSkills.length}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
          <span>👥 Max size: {team.maxTeamSize}</span>
          <span>📅 Recruitment deadline: {team.recruitmentDeadline}</span>
        </div>
      </div>

      <div className="mt-5 border-t border-gray-200 pt-4">
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
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-black bg-gray-100 px-4 py-3 text-sm font-bold text-gray-500"
          >
            <ShieldCheck size={18} />
            You already created a team for this hackathon
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
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-black bg-[#ffda3d] px-4 py-3 text-sm font-extrabold text-[#223141] shadow-[3px_3px_0px_#000] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
          >
            <UserPlus size={18} />
            Apply to Join
          </button>
        )}
      </div>
    </article>
  );
}
