
interface MatchScoreProps {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
}

export default function MatchScore({
  matchScore,
  matchedSkills,
  missingSkills,
}: MatchScoreProps) {
  return (
    <div className="w-full rounded-xl border-2 border-black bg-[#fffdf5] p-4 sm:w-48 sm:shrink-0">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
        Skill match
      </p>

      <p className="mt-1 text-3xl font-extrabold text-[#223141]">
        {matchScore}%
      </p>

      <div className="mt-3 h-3 w-full overflow-hidden rounded-full border border-black bg-gray-200">
        <div
          className="h-full rounded-full bg-[#ffda3d] transition-all"
          style={{ width: `${matchScore}%` }}
        />
      </div>

      <p className="mt-2 text-xs font-semibold text-gray-600">
        {matchedSkills.length} of{" "}
        {matchedSkills.length + missingSkills.length} skills matched
      </p>
    </div>
  );
}
