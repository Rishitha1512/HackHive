export interface DetectedSkillInput {
  languages: string[];
  readmeContent: string | null;
  dependencyFiles: {
    fileName: string;
    content: string;
  }[];
}

const languageSkills: Record<string, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  java: "Java",
  "c++": "C++",
  c: "C",
  "c#": "C#",
  go: "Go",
  rust: "Rust",
  ruby: "Ruby",
  php: "PHP",
  swift: "Swift",
  kotlin: "Kotlin",
  dart: "Dart",
  html: "HTML",
  css: "CSS",
  shell: "Shell Scripting",
  scala: "Scala",
  r: "R",
};

const packageSkills: Record<string, string> = {
  // JavaScript / TypeScript ecosystem
  react: "React",
  next: "Next.js",
  nextjs: "Next.js",
  express: "Express.js",
  expressjs: "Express.js",
  tailwindcss: "Tailwind CSS",
  vite: "Vite",
  typescript: "TypeScript",
  "@supabase/supabase-js": "Supabase",
  supabase: "Supabase",
  pg: "PostgreSQL",
  prisma: "Prisma",
  mongoose: "MongoDB",
  mongodb: "MongoDB",
  firebase: "Firebase",
  "react-router-dom": "React Router",
  vue: "Vue.js",
  nuxt: "Nuxt",
  svelte: "Svelte",
  "@angular/core": "Angular",
  redux: "Redux",
  zustand: "Zustand",
  "framer-motion": "Framer Motion",
  "socket.io": "Socket.IO",
  "@tanstack/react-query": "TanStack Query",
  "@nestjs/core": "NestJS",
  axios: "Axios",

  // Python ecosystem
  django: "Django",
  flask: "Flask",
  fastapi: "FastAPI",
  numpy: "NumPy",
  pandas: "Pandas",
  "scikit-learn": "Scikit-learn",
  sklearn: "Scikit-learn",
  tensorflow: "TensorFlow",
  torch: "PyTorch",
  "opencv-python": "OpenCV",
  sqlalchemy: "SQLAlchemy",
  streamlit: "Streamlit",
  pytest: "pytest",

  // Java ecosystem
  "spring-boot-starter": "Spring Boot",
  "spring-boot": "Spring Boot",
  spring: "Spring Framework",
  hibernate: "Hibernate",
  junit: "JUnit",

  // Rust ecosystem
  "actix-web": "Actix Web",
  tokio: "Tokio",
  serde: "Serde",
  axum: "Axum",

  // Go ecosystem
  "gin-gonic/gin": "Gin",
  "gorilla/mux": "Gorilla Mux",
  "gorm.io/gorm": "GORM",

  // Ruby / PHP ecosystem
  rails: "Ruby on Rails",
  sinatra: "Sinatra",
  "laravel/framework": "Laravel",
  "symfony/framework-bundle": "Symfony",
};

const readmeAliases: Record<string, string> = {
  "react": "React",
  "react.js": "React",
  "next.js": "Next.js",
  nextjs: "Next.js",
  "node.js": "Node.js",
  nodejs: "Node.js",
  "express.js": "Express.js",
  express: "Express.js",
  "tailwind css": "Tailwind CSS",
  tailwindcss: "Tailwind CSS",
  typescript: "TypeScript",
  javascript: "JavaScript",
  python: "Python",
  django: "Django",
  flask: "Flask",
  fastapi: "FastAPI",
  java: "Java",
  "spring boot": "Spring Boot",
  postgresql: "PostgreSQL",
  postgres: "PostgreSQL",
  mongodb: "MongoDB",
  mysql: "MySQL",
  supabase: "Supabase",
  firebase: "Firebase",
  redis: "Redis",
  docker: "Docker",
  kubernetes: "Kubernetes",
  graphql: "GraphQL",
  "rest api": "REST API",
  "machine learning": "Machine Learning",
  tensorflow: "TensorFlow",
  pytorch: "PyTorch",
  pandas: "Pandas",
  numpy: "NumPy",
};

function addSkill(skills: Map<string, string>, skill: string) {
  const key = skill.toLowerCase().trim();

  if (key && !skills.has(key)) {
    skills.set(key, skill);
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsToken(content: string, token: string): boolean {
  const escaped = escapeRegex(token);

  // Allow package names containing punctuation such as @scope/name.
  const pattern = new RegExp(
    `(^|[^a-zA-Z0-9])${escaped}($|[^a-zA-Z0-9])`,
    "i"
  );

  return pattern.test(content);
}

function detectFromPackageJson(
  content: string,
  skills: Map<string, string>
) {
  try {
    const packageJson = JSON.parse(content);

    const dependencySections = [
      packageJson.dependencies,
      packageJson.devDependencies,
      packageJson.peerDependencies,
    ];

    for (const section of dependencySections) {
      if (!section || typeof section !== "object") continue;

      for (const packageName of Object.keys(section)) {
        const skill = packageSkills[packageName.toLowerCase()];

        if (skill) addSkill(skills, skill);
      }
    }
  } catch {
    // Ignore invalid package.json files.
  }
}

function detectFromDependencyFiles(
  dependencyFiles: DetectedSkillInput["dependencyFiles"],
  skills: Map<string, string>
) {
  for (const file of dependencyFiles) {
    const fileName = file.fileName.toLowerCase();
    const content = file.content;

    if (fileName === "package.json") {
      detectFromPackageJson(content, skills);
      continue;
    }

    for (const [packageName, skill] of Object.entries(packageSkills)) {
      if (containsToken(content, packageName)) {
        addSkill(skills, skill);
      }
    }
  }
}

function detectFromReadme(
  readmeContent: string | null,
  skills: Map<string, string>
) {
  if (!readmeContent) return;

  const readme = readmeContent.toLowerCase();

  for (const [alias, skill] of Object.entries(readmeAliases)) {
    if (containsToken(readme, alias)) {
      addSkill(skills, skill);
    }
  }
}

export function detectSkills(input: DetectedSkillInput): string[] {
  const skills = new Map<string, string>();

  // 1. Detect programming languages reported by GitHub.
  for (const language of input.languages) {
    const skill = languageSkills[language.toLowerCase().trim()];

    if (skill) addSkill(skills, skill);
  }

  // 2. Detect frameworks and tools from dependency files.
  detectFromDependencyFiles(input.dependencyFiles, skills);

  // 3. Use README as an additional source.
  detectFromReadme(input.readmeContent, skills);

  return Array.from(skills.values()).sort((a, b) =>
    a.localeCompare(b)
  );
}
