import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function ClosingCta() {
  return (
    <section className="flex w-full flex-col bg-[#09090b] p-[48px]">
      <div className="relative h-[620px] w-full overflow-hidden rounded-[20px] border border-[#ffffff1a] bg-[#111113]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/landing/generated-2.png" alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#09090bf2_0%,#09090b99_60%,#09090b33_100%)]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-[28px] px-[64px]">
          <h2 className="w-full text-center font-display text-[60px] leading-[1.08] font-medium tracking-[-1.8px] text-[#fafafa]">
            Agents don&apos;t need better benchmarks.
            <br />
            They need users who stay.
          </h2>
          <p className="text-center font-body text-[19px] leading-[1.55] text-[#d4d4d8]">
            Every conversation teaches your agent something. itera makes sure it learns.
          </p>
          <Link href="/app" className="flex items-center gap-[10px] rounded-full bg-[#ff6600] px-[28px] py-[16px] transition-opacity hover:opacity-90">
            <span className="font-body text-[17px] font-medium text-[#18181b]">Start iterating</span>
            <ArrowRight className="size-[18px] text-[#18181b]" />
          </Link>
          <span className="font-mono text-[12px] tracking-[0.5px] text-[#a1a1aa]">Built at Supabase Select Hackathon 2026 · San Francisco</span>
        </div>
      </div>
    </section>
  )
}
