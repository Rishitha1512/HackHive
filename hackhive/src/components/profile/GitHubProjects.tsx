
"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ExternalLink,
  Sparkles,
  Loader2,
  Plus,
  AlertCircle,
} from "lucide-react";

interface RepositoryAnalysis {
  owner: string;
  repoName: string;
  repositoryUrl: string;
  description: string | null;
  defaultBranch: string;
  languages: Record<string, number>;
  readmePreview: string | null;
  dependencyFilesFound: string[];
}

interface GitHubProject {
  id: string;
  owner: string;
  repo_name: string;
  repository_url: string;
  description: string | null;
  detected_skills: string[];
  created_at: string;
  updated_at: string;
}

interface AnalysisResponse {
  message?: string;
  error?: string;
  repository?: RepositoryAnalysis;
  detectedSkills?: string[];
  savedProject?: {
    id: string;
  };
}

export default function GitHubProjects() {
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResponse | null>(null);

  const [projects, setProjects] = useState<GitHubProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState("");

  // Load saved GitHub projects belonging to the logged-in student
  const loadProjects = useCallback(async () => {
    setProjectsLoading(true);
    setProjectsError("");

    try {
      const supabase = createClient();

      const { data, error: fetchError } = await supabase
        .from("github_projects")
        .select(
          "id, owner, repo_name, repository_url, description, detected_skills, created_at, updated_at"
        )
        .order("updated_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setProjects(data ?? []);
    } catch (err) {
      console.error("Failed to load GitHub projects:", err);

      setProjectsError(
        "Unable to load your saved GitHub projects. Please try again."
      );
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const handleAnalyze = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!repositoryUrl.trim()) {
      setError("Please enter a GitHub repository URL.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/github/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repositoryUrl: repositoryUrl.trim(),
        }),
      });

      const data: AnalysisResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Could not analyze this repository."
        );
      }

      setResult(data);

      // Refresh the saved projects list after successful analysis
      await loadProjects();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while analyzing the repository."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-6 overflow-hidden rounded-[28px] border-2 border-black bg-white shadow-[5px_5px_0_#000]">
      {/* Header */}
      <div className="border-b-2 border-black bg-[#ffda3d] p-6 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-black bg-white shadow-[3px_3px_0_#000]">
            <svg
              viewBox="0 0 24 24"
              width="25"
              height="25"
              fill="currentColor"
              aria-label="GitHub"
              role="img"
            >
              <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.55.1.76-.24.76-.53v-2.08c-3.1.67-3.76-1.32-3.76-1.32-.5-1.29-1.24-1.63-1.24-1.63-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15 1 1.71 2.62 1.22 3.26.93.1-.72.39-1.22.71-1.5-2.47-.28-5.07-1.24-5.07-5.5 0-1.22.44-2.22 1.15-3-.12-.28-.5-1.41.11-2.94 0 0 .94-.3 3.05 1.14a10.6 10.6 0 0 1 5.55 0c2.12-1.44 3.05-1.14 3.05-1.14.61 1.53.23 2.66.12 2.94.71.78 1.14 1.78 1.14 3 0 4.27-2.6 5.21-5.08 5.49.4.35.75 1.02.75 2.06V22c0 .29.2.64.77.53A11.1 11.1 0 0 0 12 .9Z" />
            </svg>
          </div>

          <div>
            <p className="text-[10px] font-black tracking-[2px] text-black/60">
              SHOWCASE YOUR WORK
            </p>
            <h2 className="text-2xl font-black">
              My GitHub Projects
            </h2>
          </div>
        </div>

        <p className="mt-3 text-sm font-medium text-black/70">
          Analyze your public repositories and discover the technologies
          used in your projects.
        </p>
      </div>

      <div className="space-y-6 p-6 sm:p-8">
        {/* Repository input */}
        <form onSubmit={handleAnalyze}>
          <label
            htmlFor="github-repository-url"
            className="mb-2 block text-xs font-black"
          >
            GitHub Repository URL
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="github-repository-url"
              type="url"
              placeholder="https://github.com/owner/repository"
              value={repositoryUrl}
              onChange={(event) =>
                setRepositoryUrl(event.target.value)
              }
              disabled={loading}
              className="hive-input min-w-0 flex-1 disabled:opacity-60"
            />

            <button
              type="submit"
              disabled={loading}
              className="hive-button shrink-0 justify-center disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Analyze Project
                </>
              )}
            </button>
          </div>

          <p className="mt-2 text-[11px] text-gray-500">
            Only public GitHub repositories are supported currently.
          </p>
        </form>

        {/* Analysis error */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border-2 border-black bg-red-100 p-4 text-sm font-semibold"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {/* Saved GitHub projects */}
        <div className="border-t-2 border-dashed border-black/20 pt-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black">
                Your Saved Repositories
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Your analyzed projects are saved to your profile.
              </p>
            </div>

            {!projectsLoading && (
              <span className="shrink-0 rounded-full border-2 border-black bg-[#ffda3d] px-3 py-1 text-xs font-black">
                {projects.length}{" "}
                {projects.length === 1 ? "PROJECT" : "PROJECTS"}
              </span>
            )}
          </div>

          {/* Loading */}
          {projectsLoading && (
            <div className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-black/30 p-6 text-sm font-semibold text-gray-500">
              <Loader2 size={18} className="animate-spin" />
              Loading your saved projects...
            </div>
          )}

          {/* Loading error */}
          {!projectsLoading && projectsError && (
            <div
              role="alert"
              className="rounded-xl border-2 border-black bg-red-100 p-4 text-sm font-semibold"
            >
              <div className="flex items-center gap-2">
                <AlertCircle size={18} />
                {projectsError}
              </div>

              <button
                type="button"
                onClick={() => void loadProjects()}
                className="mt-3 text-xs font-black underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty state */}
          {!projectsLoading &&
            !projectsError &&
            projects.length === 0 && (
              <div className="rounded-xl border-2 border-dashed border-black/30 bg-[#fffdf5] p-6 text-center">
                <Sparkles
                  size={25}
                  className="mx-auto mb-2"
                />
                <p className="text-sm font-black">
                  No GitHub projects yet!
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Analyze your first public repository to showcase
                  your work here.
                </p>
              </div>
            )}

          {/* Saved project cards */}
          {!projectsLoading &&
            !projectsError &&
            projects.length > 0 && (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="rounded-2xl border-2 border-black bg-[#fffdf5] p-5 shadow-[3px_3px_0_#000]"
                  >
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div className="flex min-w-0 items-start gap-3">
                        <svg
                          viewBox="0 0 24 24"
                          width="25"
                          height="25"
                          fill="currentColor"
                          aria-label="GitHub"
                          role="img"
                          className="mt-0.5 shrink-0"
                        >
                          <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.55.1.76-.24.76-.53v-2.08c-3.1.67-3.76-1.32-3.76-1.32-.5-1.29-1.24-1.63-1.24-1.63-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15 1 1.71 2.62 1.22 3.26.93.1-.72.39-1.22.71-1.5-2.47-.28-5.07-1.24-5.07-5.5 0-1.22.44-2.22 1.15-3-.12-.28-.5-1.41.11-2.94 0 0 .94-.3 3.05 1.14a10.6 10.6 0 0 1 5.55 0c2.12-1.44 3.05-1.14 3.05-1.14.61 1.53.23 2.66.12 2.94.71.78 1.14 1.78 1.14 3 0 4.27-2.6 5.21-5.08 5.49.4.35.75 1.02.75 2.06V22c0 .29.2.64.77.53A11.1 11.1 0 0 0 12 .9Z" />
                        </svg>

                        <div className="min-w-0">
                          <h4 className="break-all text-base font-black">
                            {project.owner}/{project.repo_name}
                          </h4>

                          <p className="mt-1 text-xs leading-5 text-gray-600">
                            {project.description ||
                              "No repository description provided."}
                          </p>
                        </div>
                      </div>

                      <a
                        href={project.repository_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1 text-xs font-bold underline"
                      >
                        View on GitHub
                        <ExternalLink size={13} />
                      </a>
                    </div>

                    <div className="mt-4 border-t border-dashed border-black/30 pt-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Sparkles size={16} />
                        <h5 className="text-[11px] font-black tracking-wide">
                          GITHUB-DETECTED SKILLS
                        </h5>
                      </div>

                      {project.detected_skills &&
                      project.detected_skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {project.detected_skills.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full border border-black bg-[#ffda3d] px-3 py-1.5 text-xs font-bold shadow-[2px_2px_0_#000]"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">
                          No skills were detected in this repository.
                        </p>
                      )}

                      <p className="mt-3 text-[10px] text-gray-500">
                        Last analyzed:{" "}
                        {new Date(
                          project.updated_at
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>

        {/* Latest analysis result */}
        {result?.repository && (
          <div className="rounded-2xl border-2 border-black bg-[#fffdf5] p-5 shadow-[3px_3px_0_#000]">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={18} />
              <h3 className="text-sm font-black">
                Latest Analysis Successful!
              </h3>
            </div>

            <p className="text-sm font-semibold">
              {result.repository.owner}/{result.repository.repoName}
            </p>

            <p className="mt-1 text-xs text-gray-600">
              Your repository has been saved and your profile skills
              have been synchronized.
            </p>

            <a
              href={result.repository.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold underline"
            >
              View on GitHub
              <ExternalLink size={13} />
            </a>
          </div>
        )}

        <p className="text-[10px] leading-5 text-gray-500">
          GitHub-detected skills are inferred from repository data
          and do not represent verified expertise.
        </p>
      </div>
    </section>
  );
}
