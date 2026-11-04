
import Link from "next/link";
import type { Hackathon } from "@/types/hackathon";
import { MapPin, ArrowUpRight } from "lucide-react";

interface HackathonCardProps {
  hackathon: Hackathon;
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function HackathonCard({
  hackathon,
}: HackathonCardProps) {
  return (
    <Link
      href={`/hackathons/${hackathon.id}`}
      className="block h-full"
    >
      <article className="group flex h-full flex-col overflow-hidden rounded-[22px] border-2 border-black bg-white shadow-[4px_4px_0px_#000] transition-all duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#000]">
        {/* Yellow top section */}
        <div className="relative flex h-[155px] flex-col justify-between overflow-hidden border-b-2 border-black bg-[#ffda3d] p-5">
          <div className="absolute -right-4 -top-8 h-24 w-24 rounded-full border border-black/20 bg-white/30" />

          <span className="relative z-10 w-fit rounded-full border border-black bg-white px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide">
            {hackathon.mode}
          </span>

          <div className="relative z-10">
            <p className="text-xs font-bold text-black/70">
              {formatDate(hackathon.startDate)}
            </p>
            <p className="mt-1 text-sm font-black">
              {formatDate(hackathon.endDate)}
            </p>
          </div>
        </div>

        {/* White content section */}
        <div className="flex min-h-[220px] flex-1 flex-col p-5">
          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-[#b48600]">
            {hackathon.domain}
          </p>

          <h2 className="hive-heading text-xl leading-tight">
            {hackathon.title}
          </h2>

          <p className="mt-2 line-clamp-3 text-xs leading-5 text-gray-500">
            {hackathon.description}
          </p>

          <div className="mt-auto pt-5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <span className="flex items-center gap-1 font-bold text-gray-700">
                <MapPin size={13} />
                {hackathon.location}
              </span>

              <span className="font-bold text-emerald-700">
                Apply by {formatDate(hackathon.applicationDeadline)}
              </span>
            </div>

            <div className="mt-5 flex items-center gap-1 border-t border-gray-200 pt-3 text-sm font-extrabold">
              Hackathon details
              <ArrowUpRight size={16} />
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
