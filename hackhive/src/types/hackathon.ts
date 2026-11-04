
export interface Hackathon {
  id: string;
  title: string;
  domain: string;
  description: string;
  mode: "Online" | "Offline" | "Hybrid";
  location: string;
  venueDetails?: string | null;
  startDate: string;
  endDate: string;
  applicationDeadline: string;

  organizer: string;
  contactEmail: string;
  registrationUrl: string;
  website: string | null;
}