export function LandingEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-[8px]">
      <span className="h-[8px] w-[8px] bg-[#ff6600]" />
      <span className="font-mono text-[12px] font-normal tracking-[1.5px] text-[#ff6600] leading-[1.2]">{children}</span>
    </div>
  )
}
