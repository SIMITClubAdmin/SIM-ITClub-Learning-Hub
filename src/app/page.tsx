import { CtaButton } from "@/components/effects/CtaButton";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-16 text-center">
      <p className="font-mono text-sm tracking-widest text-accent uppercase">ITCamp: Frontendamentals</p>
      <h1 className="max-w-[16ch] text-5xl font-semibold tracking-tight text-balance sm:text-7xl lg:text-8xl">
        SIM ITClub Learning Hub
      </h1>
      <p className="max-w-xl text-lg text-pretty text-dim">
          Your ITCamp notes and challenge questions, in one place.
      </p>
      <div className="flex flex-wrap justify-center gap-5">
        <CtaButton href="/learn" size="lg">
          Start learning
        </CtaButton>
        <CtaButton href="/practice" size="lg">
          Try exercises
        </CtaButton>
      </div>
    </main>
  );
}
