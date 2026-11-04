import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import HackathonForm from "@/components/hackathons/HackathonForm";

export default function SubmitHackathonPage() {
  return (
    <main className="min-h-screen bg-[#fffdf5]">
      {/* Yellow heading */}
      <section className="border-b-2 border-black bg-[#ffda3d]">
        <div className="mx-auto max-w-[900px] px-5 py-10 sm:px-8">
          <Link
            href="/hackathons"
            className="mb-6 inline-flex items-center gap-2 text-sm font-bold hover:underline"
          >
            <ArrowLeft size={16} />
            Back to hackathons
          </Link>

          <p className="mb-3 text-[11px] font-black uppercase tracking-[3px]">
            Grow the community
          </p>

          <h1 className="hive-heading text-4xl sm:text-5xl">
            Submit a hackathon.
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-black/70">
            Know about an exciting hackathon? Share it with the HackHive
            community and help students discover new opportunities.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="mx-auto max-w-[900px] px-5 py-10 sm:px-8">
        <HackathonForm />
      </section>
    </main>
  );
}