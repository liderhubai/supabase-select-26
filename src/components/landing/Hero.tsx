import Link from 'next/link'
import { ArrowRight, MessageSquare, RefreshCw, RotateCcw } from 'lucide-react'

const STEPS = ['Simulate', 'Observe', 'Flag', 'Improve', 'Test & ship']

export function Hero() {
  return (
    <section id="hero" className="relative h-[760px] w-full overflow-hidden bg-[#0b0b0d]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/landing/generated.png"
        alt=""
        className="absolute top-0 left-0 h-[760px] w-[1280px] object-cover"
      />
      <div
        className="absolute top-0 left-0 h-[760px] w-[1280px]"
        style={{
          background:
            'radial-gradient(ellipse 65% 65% at 50% 45%, #09090b8c 0%, #09090b33 55%, #09090bb3 100%)',
        }}
      />
      <div className="absolute top-[48px] left-[48px] flex h-[664px] w-[1184px] flex-col items-center justify-center gap-[28px] rounded-[16px] border border-[#ffffff1a] bg-[#09090b8c] px-[96px] backdrop-blur-[10px]">
        <div className="flex items-center gap-[8px] rounded-full border border-[#ff660052] bg-[#ff66001f] px-[14px] py-[6px]">
          <span className="h-[6px] w-[6px] rounded-full bg-[#ff6600]" />
          <span className="font-body text-[13px] font-medium text-[#ffd1b3] leading-[1.2]">
            Built at Supabase Select Hackathon 2026 · San Francisco
          </span>
        </div>
        <h1 className="w-[960px] text-center font-display text-[84px] leading-[1.02] font-medium tracking-[-2.5px] text-[#fafafa]">
          Your agent will never make the same mistake again.
        </h1>
        <p className="w-[720px] text-center font-body text-[19px] leading-[1.55] font-normal text-[#a1a1aa]">
          Every great hire got feedback. Most agents get abandoned instead.
        </p>
        <div className="flex items-center gap-[12px] pt-[8px]">
          <Link
            href="/app"
            className="flex items-center gap-[10px] rounded-full bg-[#ff6600] px-[24px] py-[14px] hover:bg-[#ff7a1f]"
          >
            <MessageSquare className="h-[18px] w-[18px] text-[#18181b]" />
            <span className="font-body text-[16px] font-medium text-[#18181b] leading-[1.2]">Simulate a conversation</span>
          </Link>
          <a
            href="#how-it-works"
            className="flex items-center gap-[10px] rounded-full border border-[#ffffff26] bg-[#0a0a0a] px-[24px] py-[14px] hover:bg-[#18181b]"
          >
            <span className="font-body text-[16px] font-medium text-[#f5f5f5] leading-[1.2]">See the loop</span>
            <RefreshCw className="h-[16px] w-[16px] text-[#a1a1aa]" />
          </a>
        </div>
        <div className="flex items-center gap-[14px] pt-[28px]">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-[14px]">
              <div className="flex items-center gap-[6px] font-mono text-[12px] font-normal leading-[1.2]">
                <span className="text-[#ff6600]">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-[#d4d4d8]">{step}</span>
              </div>
              {i < STEPS.length - 1 ? (
                <ArrowRight className="h-[14px] w-[14px] text-[#52525b]" />
              ) : (
                <RotateCcw className="h-[14px] w-[14px] text-[#ff6600]" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
