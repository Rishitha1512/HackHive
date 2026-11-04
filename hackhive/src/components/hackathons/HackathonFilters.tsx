import { Search } from "lucide-react";

interface HackathonFiltersProps {
  search: string;
  setSearch: (value: string) => void;
  domain: string;
  setDomain: (value: string) => void;
  mode: string;
  setMode: (value: string) => void;
}

export default function HackathonFilters({
  search,
  setSearch,
  domain,
  setDomain,
  mode,
  setMode,
}: HackathonFiltersProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border-2 border-black bg-[#fff8d8] p-3 shadow-[3px_3px_0px_#000] md:flex-row">
      {/* Search */}
      <div className="relative flex-1">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          type="text"
          placeholder="Search events, domains, locations, or eligibility"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 w-full rounded-xl border-2 border-gray-300 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-black"
        />
      </div>

      {/* Domain filter */}
      <select
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
        className="h-11 rounded-xl border-2 border-gray-300 bg-white px-4 text-sm outline-none focus:border-black md:w-[165px]"
      >
        <option value="All">All domains</option>
        <option value="AI">AI</option>
        <option value="Web Development">Web Development</option>
        <option value="Software Development">Software Development</option>
        <option value="FinTech">FinTech</option>
      </select>

      {/* Mode filter */}
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value)}
        className="h-11 rounded-xl border-2 border-gray-300 bg-white px-4 text-sm outline-none focus:border-black md:w-[145px]"
      >
        <option value="All">Online + offline</option>
        <option value="Online">Online</option>
        <option value="Offline">Offline</option>
        <option value="Hybrid">Hybrid</option>
      </select>
    </div>
  );
}