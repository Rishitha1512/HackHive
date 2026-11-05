
import type {
  Application,
  ApplicationStatus,
} from "@/types/application";

const STORAGE_KEY = "hackhive_applications";
const MAX_ACTIVE_APPLICATIONS = 5;

type NewApplication = {
  teamId: string;
  hackathonId: string;
  applicantId: string;
};

/**
 * Get all applications stored in this browser.
 */
export function getApplications(): Application[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedApplications = localStorage.getItem(STORAGE_KEY);

    if (!storedApplications) {
      return [];
    }

    const parsed: unknown = JSON.parse(storedApplications);

    return Array.isArray(parsed) ? (parsed as Application[]) : [];
  } catch (error) {
    console.error("Error reading applications:", error);
    return [];
  }
}

/**
 * Save all applications to browser storage.
 */
function saveApplications(applications: Application[]) {
  if (typeof window === "undefined") {
    throw new Error("Application storage is unavailable.");
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
}

/**
 * Create a new application.
 */
export function createApplication(
  applicationData: NewApplication
): Application {
  const applications = getApplications();

  // Prevent applying to the same team more than once.
  const alreadyApplied = applications.some(
    (application) =>
      application.teamId === applicationData.teamId &&
      application.applicantId === applicationData.applicantId
  );

  if (alreadyApplied) {
    throw new Error("You have already applied to this team.");
  }

  // Pending and accepted applications count toward the limit.
  const activeApplications = applications.filter(
    (application) =>
      application.applicantId === applicationData.applicantId &&
      (application.status === "pending" ||
        application.status === "accepted")
  );

  if (activeApplications.length >= MAX_ACTIVE_APPLICATIONS) {
    throw new Error(
      "You have reached the maximum limit of 5 active applications."
    );
  }

  const now = new Date().toISOString();

  const newApplication: Application = {
    id: crypto.randomUUID(),
    teamId: applicationData.teamId,
    hackathonId: applicationData.hackathonId,
    applicantId: applicationData.applicantId,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  saveApplications([...applications, newApplication]);

  return newApplication;
}

/**
 * Update an application's status.
 */
export function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus
): Application[] {
  const applications = getApplications();

  const updatedApplications = applications.map((application) =>
    application.id === applicationId
      ? {
          ...application,
          status,
          updatedAt: new Date().toISOString(),
        }
      : application
  );

  saveApplications(updatedApplications);

  return updatedApplications;
}
