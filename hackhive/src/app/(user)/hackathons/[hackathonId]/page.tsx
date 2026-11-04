
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { useHackathons } from "@/hooks/useHackathons";
import HackathonDetails from "@/components/hackathons/HackathonDetails";
import { createClient } from "@/lib/supabase/client";
import type { Team } from "@/types/team";

export default function HackathonDetailsPage() {
  const params = useParams<{ hackathonId: string }>();
  const hackathonId = params.hackathonId;

  const {
    hackathons,
    loading: hackathonsLoading,
    error: hackathonsError,
  } = useHackathons();

  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsError, setTeamsError] = useState<string | null>(null);

  const hackathon = hackathons.find(
    (item) => item.id === hackathonId
  );

  useEffect(() => {
    let isActive = true;

    async function fetchTeams() {
      setTeamsLoading(true);
      setTeamsError(null);

      const supabase = createClient();

      const { data, error } = await supabase
        .from("teams")
        .select(
          "id, hackathon_id, university, name, description, max_team_size, required_skills, recruitment_deadline, created_at"
        )
        .eq("hackathon_id", hackathonId)
        .order("created_at", { ascending: false });

      if (!isActive) return;

      if (error) {
        console.error("Error fetching teams:", error.message);
        setTeamsError(error.message);
        setTeams([]);
      } else {
        const formattedTeams: Team[] = (data ?? []).map((team) => ({
          id: team.id,
          hackathonId: team.hackathon_id,
          university: team.university,
          name: team.name,
          description: team.description,
          maxTeamSize: team.max_team_size,
          requiredSkills: team.required_skills ?? [],
          recruitmentDeadline: team.recruitment_deadline,
          createdAt: team.created_at,
        }));

        setTeams(formattedTeams);
      }

      setTeamsLoading(false);
    }

    fetchTeams();

    return () => {
      isActive = false;
    };
  }, [hackathonId]);

  if (hackathonsLoading || teamsLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffdf5]">
        <p className="font-bold text-gray-500">
          Loading hackathon details...
        </p>
      </main>
    );
  }

  if (hackathonsError || teamsError || !hackathon) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffdf5] px-5">
        <div className="max-w-md text-center">
          <h1 className="hive-heading text-3xl">
            Unable to load hackathon!
          </h1>

          <p className="mt-3 text-sm text-gray-500">
            {hackathonsError ||
              teamsError ||
              "This hackathon may have been removed or the link is incorrect."}
          </p>

          <Link
            href="/hackathons"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border-2 border-black bg-[#ffda3d] px-5 py-3 text-sm font-extrabold shadow-[3px_3px_0px_#000]"
          >
            <ArrowLeft size={16} />
            Back to hackathons
          </Link>
        </div>
      </main>
    );
  }

  return (
    <HackathonDetails
      hackathon={hackathon}
      teams={teams}
    />
  );
}
