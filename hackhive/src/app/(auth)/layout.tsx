import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[45%_55%]">
      {/* LEFT PANEL */}

      <section className="honeycomb-bg relative hidden min-h-screen flex-col justify-between border-r-2 border-black p-9 lg:flex">
        <a href="/" className="flex items-center gap-2">
          <Image
            src="/images/logo-v2.png"
            alt="HackHive"
            width={30}
            height={34}
          />
          <span className="hive-heading text-xl">HackHive</span>
        </a>

        <div className="max-w-[420px]">
          <h1 className="hive-heading text-[50px] leading-[0.9]">
            Discover.
            <br />
            Connect.
            <br />
            Build.
          </h1>

          <p className="mt-6 max-w-[350px] text-sm leading-6">
            Find approved hackathons and teammates whose skills
            complement your own.
          </p>
        </div>

        <p className="text-xs font-bold">
          One account for discovery, teams, and collaboration.
        </p>
      </section>

      {/* RIGHT PANEL */}

      <section className="flex min-h-screen items-center justify-center bg-[#fffdf5] px-6 py-10">
        <div className="w-full max-w-[440px]">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <Image
              src="/images/logo-v2.png"
              alt="HackHive"
              width={28}
              height={30}
            />
            <span className="hive-heading text-xl">HackHive</span>
          </div>

          {children}
        </div>
      </section>
    </main>
  );
}