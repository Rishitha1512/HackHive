import type { ReactNode } from "react";
import { Crown, Plus, Users } from "lucide-react";
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
  /** Optional: shows empty honeycomb seats for open spots */
  maxSize?: number;
}

const HEX = "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)";

function Hex({
  children,
  empty = false,
  size = 60,
  title,
}: {
  children: ReactNode;
  empty?: boolean;
  size?: number;
  title?: string;
}) {
  return (
    <div
      title={title}
      className={`relative shrink-0 ${empty ? "bg-[#0e141b]/30" : "bg-[#0e141b]"}`}
      style={{ width: size, height: size * 1.1547, clipPath: HEX }}
    >
      <div
        className={`absolute inset-[3px] flex items-center justify-center overflow-hidden ${
          empty ? "bg-[#fffdf5]" : "bg-[#ffda3d]"
        }`}
        style={{ clipPath: HEX }}
      >
        {children}
      </div>
    </div>
  );
}

export default function TeamMemberList({
  members,
  maxSize,
}: TeamMemberListProps) {
  const openSeats = maxSize ? Math.max(maxSize - members.length, 0) : 0;

  return (
    <section className="rounded-2xl border-2 border-[#0e141b] bg-white p-4 shadow-[4px_4px_0px_#0e141b]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-[#0e141b]">The hive</h2>
          <p className="text-xs text-gray-500">
            {maxSize
              ? `${members.length} of ${maxSize} seats filled${
                  openSeats ? ` · ${openSeats} open` : " · hive is full"
                }`
              : `${members.length} ${
                  members.length === 1 ? "member" : "members"
                } in this team`}
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#0e141b] bg-[#ffda3d]">
          <Users size={17} className="text-[#0e141b]" />
        </div>
      </div>

      {members.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-[#fffdf5] px-4 py-7 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#ffda3d]">
            <Users size={22} className="text-[#0e141b]" />
          </div>
          <h3 className="font-bold text-[#0e141b]">No team members yet</h3>
          <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-gray-500">
            Team members will appear here once they join your team.
          </p>
        </div>
      ) : (
        <>
          {/* Honeycomb seats */}
          <div className="mb-4 flex flex-wrap items-start gap-x-1 gap-y-0 rounded-xl bg-[#fffdf5] px-3 pb-8 pt-3">
            {members.map((member, i) => (
              <div
                key={member.id}
                className={i % 2 === 1 ? "translate-y-6" : ""}
              >
                <Hex title={member.fullName}>
                  {member.avatarUrl ? (
                    <Image
                      src={member.avatarUrl}
                      alt={member.fullName}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-xl font-black text-[#0e141b]">
                      {member.fullName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </Hex>
              </div>
            ))}

            {Array.from({ length: openSeats }).map((_, i) => (
              <div
                key={`open-${i}`}
                className={(members.length + i) % 2 === 1 ? "translate-y-6" : ""}
              >
                <Hex empty title="Open seat">
                  <Plus size={18} className="text-[#0e141b]/40" />
                </Hex>
              </div>
            ))}
          </div>

          {/* Member rows */}
          <ul className="space-y-2">
            {members.map((member) => (
              <li
                key={member.id}
                className="rounded-xl border-2 border-[#0e141b] bg-[#fffdf5] p-3"
              >
                <div className="flex items-center gap-3">
                  {member.avatarUrl ? (
                    <Image
                      src={member.avatarUrl}
                      alt={member.fullName}
                      width={36}
                      height={36}
                      className="h-9 w-9 shrink-0 rounded-full border-2 border-[#0e141b] object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#0e141b] bg-[#ffda3d] text-sm font-black text-[#0e141b]">
                      {member.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#0e141b]">
                      {member.fullName}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {member.university}
                    </p>
                  </div>

                  {member.role === "creator" && (
                    <span className="flex shrink-0 items-center gap-1 rounded-full border border-[#0e141b] bg-[#ffda3d] px-2 py-0.5 text-[11px] font-bold text-[#0e141b]">
                      <Crown size={11} />
                      Creator
                    </span>
                  )}
                </div>

                {member.skills.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {member.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-[#0e141b]/20 bg-white px-2 py-0.5 text-[11px] font-medium text-[#0e141b]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}