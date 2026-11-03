import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Users,
  Sparkles,
  Code2,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "Discover hackathons",
    description:
      "Explore approved hackathons from universities and organisations.",
  },
  {
    icon: Users,
    title: "Find your people",
    description:
      "Discover teams that complement your skills and interests.",
  },
  {
    icon: Code2,
    title: "Build together",
    description:
      "Create your own team, collaborate and turn ideas into reality.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5ce43] px-3 py-3 sm:px-6 sm:py-4">
      <div className="mx-auto max-w-[1240px] overflow-hidden rounded-[24px] border-[2px] border-black bg-white">
        {/* NAVBAR */}

        <header className="flex h-[68px] items-center justify-between border-b border-[#e8e8e8] px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="HackHive logo"
              width={30}
              height={34}
              className="object-contain"
            />
            <span className="hive-heading text-xl">HackHive</span>
          </Link>

          <nav className="hidden items-center gap-8 text-xs font-bold md:flex">
            <Link href="/hackathons" className="hover:text-[#b48600]">
              Hackathons
            </Link>
            <Link href="/hackathons" className="hover:text-[#b48600]">
              Find teams
            </Link>
            <a href="#how-it-works" className="hover:text-[#b48600]">
              How it works
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-xs font-bold sm:block"
            >
              Log in
            </Link>

            <Link
              href="/signup"
              className="rounded-full border border-black bg-black px-4 py-2.5 text-xs font-bold text-white shadow-[2px_2px_0_#ffda3d] hover:bg-[#282828]"
            >
              Join the hive
            </Link>
          </div>
        </header>

        {/* HERO */}

        <section className="relative grid min-h-[560px] items-center px-6 py-12 sm:px-12 lg:grid-cols-2 lg:px-12 lg:py-10">
          <div className="relative z-10">
            <div className="mb-5 inline-block -rotate-2 rounded-full border border-black bg-[#fff0a6] px-4 py-2 text-[10px] font-black tracking-[2px]">
              MADE FOR STUDENT BUILDERS
            </div>

            <h1 className="hive-heading max-w-[560px] text-[66px] leading-[0.87] sm:text-[82px] lg:text-[94px]">
              Find your
              <br />
              people.
              <br />
              <span className="text-[#e5a900] [text-shadow:2px_3px_0_#000]">
                Build a buzz.
              </span>
            </h1>

            <p className="mt-7 max-w-[430px] text-sm leading-6 text-[#555] sm:text-[15px]">
              Discover approved hackathons, join a team that needs your
              skills, or start your own hive and find the right
              collaborators.
            </p>

            <div className="mt-7 flex flex-wrap gap-4">
              <Link href="/hackathons" className="hive-button">
                Discover Hackathons
                <ArrowUpRight size={16} />
              </Link>

              <Link
                href="/signup"
                className="hive-button bg-white"
              >
                Find Teammates
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="mt-9 hidden max-w-[500px] border-t border-[#ddd] pt-5 sm:block">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {["A", "M", "R", "K"].map((letter, index) => (
                    <div
                      key={letter}
                      className={`flex h-9 w-9 items-center justify-center rounded-full border border-black text-xs font-bold ${
                        index % 2 === 0 ? "bg-[#ffda3d]" : "bg-[#fff0a6]"
                      }`}
                    >
                      {letter}
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-xs font-bold">
                    Designers, developers, dreamers.
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500">
                    Everyone has a place in the hive.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* HERO IMAGE */}

          <div className="relative mt-10 h-[350px] w-full sm:h-[450px] lg:mt-0 lg:h-[470px]">
            <Image
              src="/images/hero-image.png"
              alt="Bee characters collaborating inside a honeycomb"
              fill
              priority
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </section>

        {/* FEATURES */}

        <section
          id="how-it-works"
          className="border-t border-[#e8e8e8] bg-[#fffdf5] px-6 py-16 sm:px-12"
        >
          <div className="mb-10">
            <p className="text-xs font-black tracking-[3px] text-[#b48600]">
              THE HIVE ADVANTAGE
            </p>

            <h2 className="hive-heading mt-3 text-4xl sm:text-5xl">
              Everything you need to build together.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-black bg-white p-6 transition hover:-translate-y-1 hover:shadow-[4px_5px_0_black]"
                >
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-black bg-[#ffda3d]">
                    <Icon size={23} />
                  </div>

                  <p className="mb-2 text-lg font-black">
                    {feature.title}
                  </p>

                  <p className="text-sm leading-6 text-gray-500">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* BOTTOM CTA */}

        <section className="flex flex-col items-center justify-center gap-5 bg-[#ffda3d] px-6 py-16 text-center">
          <Zap size={32} />

          <h2 className="hive-heading text-4xl sm:text-5xl">
            Your next big idea starts here.
          </h2>

          <p className="max-w-lg text-sm text-[#514515]">
            Find your team. Share your skills. Make something incredible.
          </p>

          <Link href="/signup" className="hive-button hive-button-black">
            Join HackHive <ArrowRight size={16} />
          </Link>
        </section>

        {/* FOOTER */}

        <footer className="flex flex-col items-center justify-between gap-3 border-t border-[#e5e5e5] px-8 py-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <Image
              src="/images/logo.png"
              alt=""
              width={23}
              height={26}
            />
            <span className="hive-heading text-lg">HackHive</span>
          </div>

          <p className="text-xs text-gray-500">
            © 2026 HackHive. Built for student builders.
          </p>
        </footer>
      </div>
    </main>
  );
}