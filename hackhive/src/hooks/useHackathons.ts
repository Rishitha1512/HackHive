"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Hackathon } from "@/types/hackathon";

interface HackathonRow {
  id: string;
  title: string;
  domain: string;
  description: string;
  mode: "Online" | "Offline" | "Hybrid";
  location: string;
  venue_details: string | null;
  start_date: string;
  end_date: string;
  application_deadline: string;
  organizer: string;
  contact_email: string;
  registration_url: string;
  website: string | null;
  created_by: string;
  created_at: string;
}

export function useHackathons() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHackathons = async () => {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();

        const { data, error } = await supabase
          .from("hackathons")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        const rows = (data ?? []) as HackathonRow[];

        const formattedHackathons: Hackathon[] = rows.map((row) => ({
          id: row.id,
          title: row.title,
          domain: row.domain,
          description: row.description,
          mode: row.mode,
          location: row.location,
          venueDetails: row.venue_details,
          startDate: row.start_date,
          endDate: row.end_date,
          applicationDeadline: row.application_deadline,
          organizer: row.organizer,
          contactEmail: row.contact_email,
          registrationUrl: row.registration_url,
          website: row.website,
        }));

        setHackathons(formattedHackathons);
      } catch (err) {
        console.error("Error fetching hackathons:", err);
        setError("Unable to load hackathons. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchHackathons();
  }, []);

  return { hackathons, loading, error };
}
