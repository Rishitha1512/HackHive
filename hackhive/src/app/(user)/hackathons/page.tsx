"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";

import HackathonCard from "@/components/hackathons/HackathonCard";
import HackathonFilters from "@/components/hackathons/HackathonFilters";
import { useHackathons } from "@/hooks/useHackathons";

export default function HackathonsPage() {
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState("All");
  const [mode, setMode] = useState("All");

  const { hackathons, loading, error } = useHackathons();

  const filteredHackathons = useMemo(() => {
    return hackathons.filter((hackathon) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        hackathon.title.toLowerCase().includes(searchText) ||
        hackathon.domain.toLowerCase().includes(searchText) ||
        hackathon.location.toLowerCase().includes(searchText) ||
        hackathon.description.toLowerCase().includes(searchText);

      const matchesDomain =
        domain === "All" || hackathon.domain === domain;

      const matchesMode =
        mode === "All" || hackathon.mode === mode;

      return matchesSearch && matchesDomain && matchesMode;
    });
  }, [hackathons, search, domain, mode]);

  return (
    <main className="min-h-screen bg-[#fffdf5]">
      {/* Hero section */}
      <section className="border-b-2 border-black bg-[#ffda3d]">
        <div className="mx-auto flex min-h-[295px] max-w-[1200px] flex-col items-start justify-center gap-8 px-6 py-12 md:flex-row md:items-center md:justify-between md:px-10">
          <div>
            <p className="mb-4 text-[11px] font-black uppercase tracking-[3px]">
              <Sparkles size={14} className="mr-2 inline" />
              Approved opportunities
            </p>

            <h1 className="hive-heading max-w-[650px] text-5xl leading-[0.95] sm:text-6xl md:text-7xl">
              Discover. Connect.
              <br />
              Build.
            </h1>
          </div>

          <Link
            href="/hackathons/submit"
            className="hive-button inline-flex shrink-0 items-center gap-2 rounded-xl border-2 border-black bg-white px-5 py-3 text-sm font-extrabold shadow-[3px_3px_0px_#000] transition hover:-translate-y-1 hover:shadow-[5px_5px_0px_#000]"
          >
            <Plus size={17} />
            Submit a hackathon
          </Link>
        </div>
      </section>

      {/* Listing section */}
      <section className="mx-auto max-w-[1200px] px-5 py-10 sm:px-8 md:py-12">
        <HackathonFilters
          search={search}
          setSearch={setSearch}
          domain={domain}
          setDomain={setDomain}
          mode={mode}
          setMode={setMode}
        />

        <div className="mb-6 mt-10 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="hive-heading text-2xl sm:text-3xl">
              Explore hackathons
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Find your next opportunity to build something amazing.
            </p>
          </div>

          <span className="rounded-full border border-black bg-[#ffda3d] px-3 py-1 text-xs font-extrabold">
            {loading ? "Loading..." : `${filteredHackathons.length} opportunities`}
          </span>
        </div>

        {/* Loading */}
        {loading && (
          <p className="py-16 text-center text-sm font-semibold text-gray-500">
            Loading hackathons...
          </p>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl border-2 border-red-300 bg-red-50 p-6 text-center">
            <p className="font-bold text-red-700">{error}</p>
          </div>
        )}

        {/* Hackathon cards */}
        {!loading && !error && filteredHackathons.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredHackathons.map((hackathon) => (
              <HackathonCard
                key={hackathon.id}
                hackathon={hackathon}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredHackathons.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-gray-300 py-16 text-center">
            <h3 className="hive-heading text-xl">
              {hackathons.length === 0
                ? "No hackathons yet!"
                : "No hackathons found!"}
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              {hackathons.length === 0
                ? "Be the first to share a hackathon with the community."
                : "Try changing your search or filters."}
            </p>

            {hackathons.length === 0 ? (
              <Link
                href="/hackathons/submit"
                className="mt-5 inline-flex rounded-lg border-2 border-black bg-[#ffda3d] px-4 py-2 text-sm font-bold"
              >
                Submit a hackathon
              </Link>
            ) : (
              <button
                onClick={() => {
                  setSearch("");
                  setDomain("All");
                  setMode("All");
                }}
                className="mt-5 rounded-lg border-2 border-black bg-[#ffda3d] px-4 py-2 text-sm font-bold"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </section>
    </main>
  );
}