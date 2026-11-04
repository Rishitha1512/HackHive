
import type { Team } from "@/types/team";

function getStorageKey(hackathonId: string) {
  return `hackhive-teams-${hackathonId}`;
}

export function getTeams(
  hackathonId: string,
  university: string
): Team[] {
  if (typeof window === "undefined" || !university.trim()) {
    return [];
  }

  try {
    const stored = localStorage.getItem(getStorageKey(hackathonId));
    const teams: Team[] = stored ? JSON.parse(stored) : [];

    return teams.filter(
      (team) =>
        team.university.trim().toLowerCase() ===
        university.trim().toLowerCase()
    );
  } catch (error) {
    console.error("Error reading teams:", error);
    return [];
  }
}

export function saveTeam(team: Team) {
  const existingTeams: Team[] = (() => {
    try {
      const stored = localStorage.getItem(
        getStorageKey(team.hackathonId)
      );

      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  })();

  const updatedTeams = [team, ...existingTeams];

  localStorage.setItem(
    getStorageKey(team.hackathonId),
    JSON.stringify(updatedTeams)
  );
}
