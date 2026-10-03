export function Eyebrow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-[8px]">
      <span className="size-[8px] bg-[#ff6600]" />
      <span className="font-mono text-[12px] font-normal tracking-[1.5px] text-[#ff6600]">{label}</span>
    </div>
  )
}
