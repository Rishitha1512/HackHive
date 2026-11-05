"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { LoaderCircle, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import TeamWorkspace from "@/components/teams/TeamWorkspace";
import type { TeamMember } from "@/components/teams/TeamMemberList";

interface TeamData {
  id: string;
  name: string;
  description: string | null;
  university: string | null;
  max_team_size: number;
  required_skills: string[] | null;
  recruitment_deadline: string | null;
}

interface HackathonData {
  id: string;
  title: string;
  domain: string | null;
  description: string | null;
  mode: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  organizer: string | null;
}

interface WorkspaceData {
  team: TeamData;
  hackathon: HackathonData;
  members: {
    id: string;
    full_name: string | null;
    university: string | null;
    skills: string[] | null;
    avatar_url: string | null;
    role: "creator" | "member";
  }[];
}

export default function TeamPage() {
  const params = useParams<{
    hackathonId: string;
    teamId: string;
  }>();

  const { hackathonId, teamId } = params;

  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchWorkspace = async () => {
      const supabase = createClient();

      setLoading(true);
      setError("");

      const { data, error: workspaceError } = await supabase.rpc(
        "get_team_workspace",
        {
          p_team_id: teamId,
          p_hackathon_id: hackathonId,
        }
      );

      if (workspaceError || !data) {
        console.error("Error fetching team workspace:", workspaceError);

        setError(
          workspaceError?.message.includes("not a member")
            ? "You must be a member of this team to access its workspace."
            : "We couldn't load this team workspace. Please try again."
        );

        setLoading(false);
        return;
      }

      const workspaceData = data as WorkspaceData;

      if (!workspaceData.team || !workspaceData.hackathon) {
        setError("The team or hackathon could not be found.");
        setLoading(false);
        return;
      }

      const formattedMembers: TeamMember[] = (
        workspaceData.members || []
      ).map((member) => ({
        id: member.id,
        fullName: member.full_name || "Unnamed member",
        university: member.university || "University not provided",
        skills: member.skills || [],
        avatarUrl: member.avatar_url,
        role: member.role,
      }));

      setWorkspace(workspaceData);
      setMembers(formattedMembers);
      setLoading(false);
    };

    if (hackathonId && teamId) {
      fetchWorkspace();
    }
  }, [hackathonId, teamId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fffdf5]">
        <div className="text-center">
          <LoaderCircle
            size={38}
            className="mx-auto animate-spin text-[#223141]"
          />

          <p className="mt-4 font-bold text-[#223141]">
            Preparing your team workspace...
          </p>
        </div>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fffdf5] px-5">
        <div className="w-full max-w-md rounded-2xl border-2 border-[#223141] bg-white p-7 text-center shadow-[5px_5px_0px_#223141]">
          <AlertCircle size={38} className="mx-auto text-red-500" />

          <h1 className="mt-4 text-xl font-black text-[#223141]">
            Workspace unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            {error || "Something went wrong while loading this workspace."}
          </p>

          <Link
            href={`/hackathons/${hackathonId}`}
            className="mt-6 inline-flex items-center gap-2 rounded-xl border-2 border-[#223141] bg-[#ffda3d] px-5 py-3 font-bold text-[#223141] shadow-[3px_3px_0px_#223141] transition hover:translate-y-0.5 hover:shadow-none"
          >
            <ArrowLeft size={17} />
            Back to Hackathon
          </Link>
        </div>
      </div>
    );
  }

  const { team, hackathon } = workspace;

  return (
    <TeamWorkspace
      hackathonId={hackathonId}
      team={{
        id: team.id,
        name: team.name,
        description: team.description || "",
        university: team.university || "",
        maxTeamSize: team.max_team_size,
        requiredSkills: team.required_skills || [],
        recruitmentDeadline: team.recruitment_deadline || "",
      }}
      hackathon={{
        title: hackathon.title,
        domain: hackathon.domain || "",
        description: hackathon.description || "",
        mode: hackathon.mode || "",
        location: hackathon.location || "",
        startDate: hackathon.start_date || "",
        endDate: hackathon.end_date || "",
        organizer: hackathon.organizer || "",
      }}
      members={members}
    />
  );
}