
export type ApplicationStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "withdrawn";

export interface Application {
  id: string;

  // The team the student wants to join
  teamId: string;

  // The hackathon associated with that team
  hackathonId: string;

  // The student who submitted the application
  applicantId: string;

  // Current application status
  status: ApplicationStatus;

  // When the application was submitted
  createdAt: string;

  // When the application was last updated
  updatedAt: string;
}
