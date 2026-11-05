"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, RotateCcw, Search, Sparkles, X } from "lucide-react";

import HackathonCard from "@/components/hackathons/HackathonCard";
import { useHackathons } from "@/hooks/useHackathons";

type Hackathon = ReturnType<typeof useHackathons>["hackathons"][number];

/* ---------- constants & helpers ---------- */

const HONEYCOMB =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100' viewBox='0 0 56 100'%3E%3Cpath d='M28 66L0 50V16L28 0l28 16v34L28 66zM28 100L0 84V50l28-16 28 16v34l-28 16z' fill='none' stroke='%23000' stroke-opacity='.09' stroke-width='2'/%3E%3C/svg%3E\")";

// Slightly stronger version for the card headers.
const HONEYCOMB_CARD = HONEYCOMB.replace(".09", ".15");

const pop = (delay: number) => ({ "--d": `${delay}ms` } as React.CSSProperties);

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

/* A hackathon card dressed up with a honeycomb header */
function HoneyCard({
  hackathon,
  delay,
}: {
  hackathon: Hackathon;
  delay: number;
}) {
  return (
    <div className="hh-pop hh-lift relative" style={pop(delay)}>
      <HackathonCard hackathon={hackathon} />

      {/* Honeycomb pattern + hexagon cluster laid over the yellow header */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-[2px] right-[2px] top-[2px] h-[151px] overflow-hidden rounded-t-[14px]"
        style={{
          backgroundImage: HONEYCOMB_CARD,
          backgroundSize: "56px 100px",
        }}
      >
        <svg
          viewBox="0 0 120 110"
          className="absolute -right-2 -top-1 h-[110px] w-[120px]"
        >
          <polygon
            points={hexPoints(92, 22, 26)}
            fill="#fff0ae"
            stroke="#000"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <polygon
            points={hexPoints(47, 22, 26)}
            fill="#ffda3d"
            stroke="#000"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <polygon
            points={hexPoints(69.5, 61, 26)}
            fill="#fff"
            stroke="#000"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

/* ---------- page ---------- */

export default function HackathonsPage() {
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState("All");
  const [mode, setMode] = useState("All");

  const { hackathons, loading, error } = useHackathons();

  const matchesSearch = (hackathon: Hackathon) => {
    const text = search.toLowerCase();
    return (
      hackathon.title.toLowerCase().includes(text) ||
      hackathon.domain.toLowerCase().includes(text) ||
      hackathon.location.toLowerCase().includes(text) ||
      hackathon.description.toLowerCase().includes(text)
    );
  };

  const filteredHackathons = useMemo(() => {
    return hackathons.filter((hackathon) => {
      const matchesDomain = domain === "All" || hackathon.domain === domain;
      const matchesMode = mode === "All" || hackathon.mode === mode;
      return matchesSearch(hackathon) && matchesDomain && matchesMode;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hackathons, search, domain, mode]);

  // Domain + mode options come straight from the data, with live counts.
  const domainOptions = useMemo(() => {
    const pool = hackathons.filter(
      (h) => matchesSearch(h) && (mode === "All" || h.mode === mode)
    );

    const counts = new Map<string, number>();
    hackathons.forEach((h) => {
      if (!counts.has(h.domain)) counts.set(h.domain, 0);
    });
    pool.forEach((h) => counts.set(h.domain, (counts.get(h.domain) ?? 0) + 1));

    return {
      total: pool.length,
      list: Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0])),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hackathons, search, mode]);

  const modeOptions = useMemo(
    () => Array.from(new Set(hackathons.map((h) => h.mode))).filter(Boolean),
    [hackathons]
  );

  const hasActiveFilters = search !== "" || domain !== "All" || mode !== "All";

  const clearFilters = () => {
    setSearch("");
    setDomain("All");
    setMode("All");
  };

  const chipBase =
    "shrink-0 rounded-full border border-black px-3 py-1.5 text-xs font-bold transition";

  return (
    <main className="min-h-screen bg-[#fffdf5]">
      <style>{`
        @keyframes hh-pop {
          0%   { opacity: 0; transform: translateY(24px) scale(.94); }
          60%  { opacity: 1; transform: translateY(-3px) scale(1.01); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes hh-pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: .55; }
        }
        .hh-pop {
          opacity: 0;
          animation: hh-pop .6s cubic-bezier(.34,1.56,.64,1) forwards;
          animation-delay: var(--d, 0ms);
        }
        .hh-lift { transition: transform .22s cubic-bezier(.34,1.56,.64,1); }
        .hh-lift:hover { transform: translateY(-5px) rotate(-.4deg); }
        .hh-skeleton { animation: hh-pulse 1.4s ease-in-out infinite; }
        .hh-scroll { scrollbar-width: none; }
        .hh-scroll::-webkit-scrollbar { display: none; }

        @media (prefers-reduced-motion: reduce) {
          .hh-pop { animation: none; opacity: 1; }
          .hh-skeleton { animation: none; }
          .hh-lift:hover { transform: none; }
        }
      `}</style>

      <div className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8 lg:py-10">
        {/* ============ COMMAND CENTER ============ */}

        <section
          className="hh-pop rounded-[28px] border-2 border-black bg-[#ffda3d] p-5 shadow-[6px_6px_0_#000] sm:p-7"
          style={{
            ...pop(0),
            backgroundImage: HONEYCOMB,
            backgroundSize: "56px 100px",
          }}
        >
          {/* title row */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-1.5 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[3px] text-black/70">
                <Sparkles size={12} />
                Approved opportunities
              </p>
              <h1 className="hive-heading text-3xl leading-none sm:text-5xl">
                Discover. Connect. Build.
              </h1>
            </div>

            <Link
              href="/hackathons/submit"
              className="hive-button inline-flex shrink-0 items-center gap-2 rounded-xl border-2 border-black bg-white px-4 py-2.5 text-xs font-extrabold shadow-[3px_3px_0px_#000] transition hover:-translate-y-1 hover:shadow-[5px_5px_0px_#000]"
            >
              <Plus size={15} />
              Submit a hackathon
            </Link>
          </div>

          {/* filters row: domain chips | SEARCH | mode toggle */}
          {!loading && !error && hackathons.length > 0 && (
            <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="hh-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:max-w-[48%] lg:flex-wrap lg:overflow-visible lg:pb-0">
                <button
                  onClick={() => setDomain("All")}
                  className={`${chipBase} ${
                    domain === "All"
                      ? "bg-black text-[#ffda3d]"
                      : "bg-white hover:bg-[#fff2bf]"
                  }`}
                >
                  All <span className="opacity-60">{domainOptions.total}</span>
                </button>

                {domainOptions.list.map(([name, count]) => (
                  <button
                    key={name}
                    onClick={() => setDomain(domain === name ? "All" : name)}
                    className={`${chipBase} ${
                      domain === name
                        ? "bg-black text-[#ffda3d]"
                        : count === 0
                        ? "bg-white/50 text-black/40 hover:bg-white"
                        : "bg-white hover:bg-[#fff2bf]"
                    }`}
                  >
                    {name} <span className="opacity-60">{count}</span>
                  </button>
                ))}
              </div>

              {/* search sits between the filters */}
              <div className="relative min-w-[180px] flex-1">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-black/50"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search the hive..."
                  aria-label="Search hackathons"
                  className="w-full rounded-full border-2 border-black bg-white py-2 pl-9 pr-9 text-xs font-semibold outline-none transition placeholder:font-medium placeholder:text-gray-400 focus:shadow-[3px_3px_0_#000]"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-[#ffda3d] transition hover:bg-black hover:text-[#ffda3d]"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>

              {modeOptions.length > 1 && (
                <div className="inline-flex shrink-0 self-start rounded-full border-2 border-black bg-white p-1 lg:self-auto">
                  {["All", ...modeOptions].map((option) => (
                    <button
                      key={option}
                      onClick={() => setMode(option)}
                      className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                        mode === option
                          ? "bg-black text-[#ffda3d]"
                          : "hover:bg-[#fff2bf]"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ============ RESULTS ============ */}

        <section className="mt-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <span className="rounded-full border border-black bg-[#ffda3d] px-3 py-1 text-xs font-extrabold shadow-[2px_2px_0_#000]">
              {loading
                ? "Loading..."
                : `${filteredHackathons.length} ${
                    filteredHackathons.length === 1
                      ? "opportunity"
                      : "opportunities"
                  }`}
            </span>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 underline-offset-2 hover:text-black hover:underline"
              >
                <RotateCcw size={12} /> Clear filters
              </button>
            )}
          </div>

          {/* Loading skeletons */}
          {loading && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="hh-skeleton overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0_#000]"
                  style={{ animationDelay: `${i * 150}ms` }}
                >
                  <div className="h-[150px] bg-[#ffda3d]" />
                  <div className="space-y-3 p-5">
                    <div className="h-3 w-16 rounded-full bg-[#fff0ae]" />
                    <div className="h-5 w-3/4 rounded-full bg-gray-200" />
                    <div className="h-3 w-full rounded-full bg-gray-100" />
                    <div className="h-3 w-5/6 rounded-full bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="rounded-2xl border-2 border-black bg-red-100 p-6 text-center shadow-[4px_4px_0_#000]">
              <p className="font-bold text-red-700">{error}</p>
            </div>
          )}

          {/* Hackathon cards, honeycomb themed */}
          {!loading && !error && filteredHackathons.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredHackathons.map((hackathon, i) => (
                <HoneyCard
                  key={hackathon.id}
                  hackathon={hackathon}
                  delay={100 + Math.min(i, 8) * 80}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && filteredHackathons.length === 0 && (
            <div className="rounded-[28px] border-2 border-dashed border-black bg-[#fff8d6] px-6 py-12 text-center">
              <p className="text-4xl">🐝</p>

              <h3 className="hive-heading mt-3 text-xl">
                {hackathons.length === 0
                  ? "The hive is quiet... too quiet."
                  : "Not a single bee in sight!"}
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm text-gray-600">
                {hackathons.length === 0
                  ? "No hackathons yet. Be the first to share one."
                  : "Nothing matches those filters. Loosen them up."}
              </p>

              {hackathons.length === 0 ? (
                <Link
                  href="/hackathons/submit"
                  className="mt-5 inline-flex items-center gap-2 rounded-lg border-2 border-black bg-[#ffda3d] px-4 py-2 text-sm font-bold shadow-[3px_3px_0_#000]"
                >
                  <Plus size={15} /> Submit a hackathon
                </Link>
              ) : (
                <button
                  onClick={clearFilters}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg border-2 border-black bg-[#ffda3d] px-4 py-2 text-sm font-bold shadow-[3px_3px_0_#000]"
                >
                  <RotateCcw size={15} /> Clear filters
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}