
export interface TeamMatch {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
}

/**
 * Normalizes skills so comparisons are case-insensitive
 * and ignore accidental spaces or duplicate entries.
 */
function normalizeSkills(skills: string[]): string[] {
  return [
    ...new Set(
      skills
        .map((skill) => skill.trim().toLowerCase())
        .filter(Boolean)
    ),
  ];
}

/**
 * Calculates how well a student's skills match
 * the skills required by a team.
 */
export function calculateTeamMatch(
  userSkills: string[],
  requiredSkills: string[]
): TeamMatch {
  const normalizedUserSkills = normalizeSkills(userSkills);
  const normalizedRequiredSkills = normalizeSkills(requiredSkills);

  const userSkillSet = new Set(normalizedUserSkills);

  const matchedSkills = normalizedRequiredSkills.filter((skill) =>
    userSkillSet.has(skill)
  );

  const missingSkills = normalizedRequiredSkills.filter(
    (skill) => !userSkillSet.has(skill)
  );

  const matchScore =
    normalizedRequiredSkills.length === 0
      ? 0
      : Math.round(
          (matchedSkills.length / normalizedRequiredSkills.length) * 100
        );

  return {
    matchScore,
    matchedSkills,
    missingSkills,
  };
}

/**
 * Adds match information to every team and sorts
 * teams from highest match percentage to lowest.
 */
export function sortTeamsByMatch<T extends {
  requiredSkills: string[];
}>(
  teams: T[],
  userSkills: string[]
): (T & TeamMatch)[] {
  return teams
    .map((team) => ({
      ...team,
      ...calculateTeamMatch(userSkills, team.requiredSkills),
    }))
    .sort((a, b) => b.matchScore - a.matchScore);
}
