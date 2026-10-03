import { Triangle, Zap } from 'lucide-react'

export function BuiltWith() {
  return (
    <section id="built-with" className="flex w-full items-center justify-center gap-[48px] bg-[#09090b] px-[48px] py-[56px]">
      <span className="font-mono text-[12px] tracking-[2px] text-[#71717a]">BUILT WITH</span>
      <div className="flex items-center gap-[10px]">
        <Zap className="size-[26px] text-[#3ecf8e]" />
        <span className="font-display text-[28px] leading-[1.2] font-semibold tracking-[-0.5px] text-[#fafafa]">Supabase</span>
      </div>
      <span className="font-display text-[28px] leading-[1.2] text-[#3f3f46]">·</span>
      <div className="flex items-center gap-[10px]">
        <Triangle className="size-[22px] text-[#fafafa]" />
        <span className="font-display text-[28px] leading-[1.2] font-semibold tracking-[-0.5px] text-[#fafafa]">Vercel AI SDK</span>
      </div>
    </section>
  )
}
