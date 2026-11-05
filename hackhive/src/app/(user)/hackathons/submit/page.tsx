import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import HackathonForm from "@/components/hackathons/HackathonForm";

const HONEYCOMB =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100' viewBox='0 0 56 100'%3E%3Cpath d='M28 66L0 50V16L28 0l28 16v34L28 66zM28 100L0 84V50l28-16 28 16v34l-28 16z' fill='none' stroke='%23000' stroke-opacity='.09' stroke-width='2'/%3E%3C/svg%3E\")";

// Points for a pointy-top hexagon.
const hexPoints = (cx: number, cy: number, r: number) =>
  [
    [cx, cy - r],
    [cx + r * 0.866, cy - r / 2],
    [cx + r * 0.866, cy + r / 2],
    [cx, cy + r],
    [cx - r * 0.866, cy + r / 2],
    [cx - r * 0.866, cy - r / 2],
  ]
    .map((p) => p.join(","))
    .join(" ");

export default function SubmitHackathonPage() {
  return (
    <main className="min-h-screen bg-[#fffdf5]">
      <div className="mx-auto max-w-[900px] px-5 py-8 sm:px-8">
        {/* Honeycomb heading */}
        <section
          className="relative overflow-hidden rounded-[28px] border-2 border-black bg-[#ffda3d] p-6 shadow-[6px_6px_0_#000] sm:p-8"
          style={{
            backgroundImage: HONEYCOMB,
            backgroundSize: "56px 100px",
          }}
        >
          {/* hexagon cluster */}
          <svg
            aria-hidden
            viewBox="0 0 170 150"
            className="pointer-events-none absolute -right-3 -top-3 hidden h-[150px] w-[170px] sm:block"
          >
            <polygon
              points={hexPoints(125, 38, 36)}
              fill="#fff0ae"
              stroke="#000"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <polygon
              points={hexPoints(62.6, 38, 36)}
              fill="#fff"
              stroke="#000"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <polygon
              points={hexPoints(93.8, 92, 36)}
              fill="#000"
              stroke="#000"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </svg>

          <div className="relative">
            <Link
              href="/hackathons"
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-black bg-white px-3 py-1.5 text-xs font-bold transition hover:bg-[#fff2bf]"
            >
              <ArrowLeft size={14} />
              Back to hackathons
            </Link>

            <p className="mb-2 text-[11px] font-black uppercase tracking-[3px]">
              Grow the community
            </p>

            <h1 className="hive-heading text-4xl sm:text-5xl">
              Submit a hackathon.
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-black/70">
              Know about an exciting hackathon? Share it with the HackHive
              community and help students discover new opportunities.
            </p>
          </div>
        </section>

        {/* Form */}
        <section className="mt-8">
          <HackathonForm />
        </section>
      </div>
    </main>
  );
}