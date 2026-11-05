
import { Crown, Users } from "lucide-react";
import Image from "next/image";

export interface TeamMember {
  id: string;
  fullName: string;
  university: string;
  skills: string[];
  avatarUrl: string | null;
  role: "creator" | "member";
}

interface TeamMemberListProps {
  members: TeamMember[];
}

export default function TeamMemberList({
  members,
}: TeamMemberListProps) {
  return (
    <section className="rounded-2xl border-2 border-[#223141] bg-white p-5 shadow-[5px_5px_0px_#223141] sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-[#223141]">
            Team Members
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Meet the people building this project.
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#223141] bg-[#ffda3d]">
          <Users size={21} className="text-[#223141]" />
        </div>
      </div>

      {members.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-[#fffdf5] px-5 py-10 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#ffda3d]">
            <Users size={26} className="text-[#223141]" />
          </div>

          <h3 className="font-bold text-[#223141]">
            No team members yet
          </h3>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
            Team members will appear here once they join your team.
          </p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm font-semibold text-gray-500">
            {members.length} {members.length === 1 ? "member" : "members"} in this team
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="rounded-xl border-2 border-[#223141] bg-[#fffdf5] p-4"
              >
                <div className="flex items-center gap-3">
                  {member.avatarUrl ? (
                    <Image
                      src={member.avatarUrl}
                      alt={member.fullName}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full border-2 border-[#223141] object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[#223141] bg-[#ffda3d] text-lg font-black text-[#223141]">
                      {member.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-[#223141]">
                      {member.fullName}
                    </p>

                    <p className="truncate text-xs text-gray-500">
                      {member.university}
                    </p>
                  </div>

                  {member.role === "creator" && (
                    <span className="flex shrink-0 items-center gap-1 rounded-full border border-[#223141] bg-[#ffda3d] px-2 py-1 text-xs font-bold text-[#223141]">
                      <Crown size={12} />
                      Creator
                    </span>
                  )}
                </div>

                {member.skills.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {member.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-[#223141]/20 bg-white px-2.5 py-1 text-xs font-medium text-[#223141]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
