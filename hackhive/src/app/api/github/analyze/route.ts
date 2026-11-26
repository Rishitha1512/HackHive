
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { detectSkills } from "@/lib/github/skill-detection";

const GITHUB_API = process.env.GITHUB_API_URL;

const headers = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

const dependencyFiles = [
  "package.json",
  "requirements.txt",
  "pyproject.toml",
  "Pipfile",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "Cargo.toml",
  "go.mod",
  "Gemfile",
  "composer.json",
];

async function fetchGitHubFile(
  owner: string,
  repoName: string,
  filePath: string
): Promise<string | null> {
  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repoName}/contents/${filePath}`,
    { headers }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`GitHub file request failed: ${filePath}`);
  }

  const data = await response.json();

  if (data.encoding !== "base64" || !data.content) {
    return null;
  }

  return Buffer.from(data.content, "base64").toString("utf-8");
}

export async function POST(request: Request) {
  try {
    // 1. Authenticate the student
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "You must be logged in to add a GitHub project.",
        },
        { status: 401 }
      );
    }

    // 2. Read the repository URL
    const body = await request.json();
    const repositoryUrl = body.repositoryUrl;

    if (
      typeof repositoryUrl !== "string" ||
      !repositoryUrl.trim()
    ) {
      return NextResponse.json(
        { error: "Please provide a GitHub repository URL." },
        { status: 400 }
      );
    }

    // 3. Validate and extract repository details
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(repositoryUrl.trim());
    } catch {
      return NextResponse.json(
        { error: "Invalid repository URL." },
        { status: 400 }
      );
    }

    if (
      parsedUrl.protocol !== "https:" ||
      parsedUrl.hostname !== "github.com"
    ) {
      return NextResponse.json(
        {
          error: "Please provide a valid GitHub repository URL.",
        },
        { status: 400 }
      );
    }

    const pathParts = parsedUrl.pathname
      .split("/")
      .filter(Boolean);

    if (
      pathParts.length !== 2 ||
      pathParts.some(
        (part) => !/^[a-zA-Z0-9_.-]+$/.test(part)
      )
    ) {
      return NextResponse.json(
        {
          error: "Please provide a valid GitHub repository URL.",
        },
        { status: 400 }
      );
    }

    const [owner, repoName] = pathParts;

    if (repoName.endsWith(".git")) {
      return NextResponse.json(
        {
          error: "Please provide the repository URL without .git.",
        },
        { status: 400 }
      );
    }

    // 4. Check GitHub analysis rate limits
    const { data: quotaData, error: quotaError } =
      await supabase.rpc("consume_github_analysis_quota");

    if (quotaError || !quotaData || quotaData.length === 0) {
      console.error("Rate limit check failed:", quotaError);

      return NextResponse.json(
        {
          error:
            "Unable to verify your analysis quota. Please try again.",
        },
        { status: 503 }
      );
    }

    const quota = quotaData[0];

    if (!quota.allowed) {
      const isGlobalLimit = quota.reason === "global_limit";

      return NextResponse.json(
        {
          error: isGlobalLimit
            ? "HackHive's GitHub analysis limit has been reached. Please try again later."
            : "You've reached your GitHub analysis limit. Please try again after your quota resets.",
          retryAfterSeconds: quota.retry_after_seconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(quota.retry_after_seconds),
          },
        }
      );
    }

    // 5. Fetch repository details
    const repositoryResponse = await fetch(
      `${GITHUB_API}/repos/${owner}/${repoName}`,
      { headers }
    );

    if (repositoryResponse.status === 404) {
      return NextResponse.json(
        {
          error:
            "Repository not found or it is not publicly accessible.",
        },
        { status: 404 }
      );
    }

    if (!repositoryResponse.ok) {
      return NextResponse.json(
        {
          error: "Unable to fetch repository details from GitHub.",
        },
        { status: repositoryResponse.status }
      );
    }

    const repositoryData = await repositoryResponse.json();

    // 6. Fetch programming languages
    const languagesResponse = await fetch(
      `${GITHUB_API}/repos/${owner}/${repoName}/languages`,
      { headers }
    );

    if (!languagesResponse.ok) {
      return NextResponse.json(
        { error: "Unable to fetch repository languages." },
        { status: languagesResponse.status }
      );
    }

    const languagesData: Record<string, number> =
      await languagesResponse.json();

    const detectedLanguages = Object.keys(languagesData);

    // 7. Fetch README
    const readmeResponse = await fetch(
      `${GITHUB_API}/repos/${owner}/${repoName}/readme`,
      { headers }
    );

    let readmeContent: string | null = null;

    if (readmeResponse.ok) {
      const readmeData = await readmeResponse.json();

      if (
        readmeData.encoding === "base64" &&
        readmeData.content
      ) {
        readmeContent = Buffer.from(
          readmeData.content,
          "base64"
        ).toString("utf-8");
      }
    } else if (readmeResponse.status !== 404) {
      return NextResponse.json(
        { error: "Unable to fetch the repository README." },
        { status: readmeResponse.status }
      );
    }

    // 8. Fetch dependency and configuration files
    const dependencyResults = await Promise.all(
      dependencyFiles.map(async (fileName) => {
        const content = await fetchGitHubFile(
          owner,
          repoName,
          fileName
        );

        return content ? { fileName, content } : null;
      })
    );

    const foundDependencyFiles = dependencyResults.filter(
      (
        file
      ): file is { fileName: string; content: string } =>
        file !== null
    );

    // 9. Detect skills
    const detectedSkills = detectSkills({
      languages: detectedLanguages,
      readmeContent,
      dependencyFiles: foundDependencyFiles,
    });

    // 10. Save the project and synchronize profile skills
    const { data: savedProject, error: saveError } =
      await supabase.rpc("save_github_project", {
        p_owner: repositoryData.owner.login,
        p_repo_name: repositoryData.name,
        p_repository_url: repositoryData.html_url,
        p_description: repositoryData.description,
        p_detected_skills: detectedSkills,
      });

    if (saveError || !savedProject) {
      console.error("GitHub project save failed:", saveError);

      return NextResponse.json(
        {
          error:
            "Repository analysis succeeded, but we couldn't save the project. Please try again.",
        },
        { status: 500 }
      );
    }

    // 11. Return repository information and saved project
    return NextResponse.json({
      message: "GitHub project analyzed and saved successfully!",
      repository: {
        owner: repositoryData.owner.login,
        repoName: repositoryData.name,
        repositoryUrl: repositoryData.html_url,
        description: repositoryData.description,
        defaultBranch: repositoryData.default_branch,
        languages: detectedLanguages,
        readmePreview: readmeContent
          ? readmeContent.slice(0, 1500)
          : null,
        dependencyFilesFound: foundDependencyFiles.map(
          (file) => file.fileName
        ),
      },
      detectedSkills,
      savedProject,
      userId: user.id,
    });
  } catch (error) {
    console.error("GitHub analysis error:", error);

    return NextResponse.json(
      {
        error:
          "Something went wrong while processing the repository.",
      },
      { status: 500 }
    );
  }
}
