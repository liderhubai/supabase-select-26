import { LandingEyebrow } from './Eyebrow'

const body = 'font-body text-[17px] leading-[1.65] font-normal text-[#a1a1aa]'
const source = 'font-mono text-[11px] leading-[1.6] font-normal text-[#71717a]'

export function Insight() {
  return (
    <section id="insight" className="flex w-full flex-col gap-[96px] bg-[#09090b] px-[48px] py-[120px]">
      {/* Story Row */}
      <div className="flex w-full items-center gap-[80px]">
        <div className="flex min-w-0 flex-1 flex-col gap-[24px]">
          <LandingEyebrow>THE INSIGHT</LandingEyebrow>
          <h2 className="font-display text-[56px] leading-[1.05] font-medium tracking-[-1.5px] text-[#fafafa]">
            Everyone is fighting over the 15%.
          </h2>
          <div className={body}>
            <p>
              When Ajay Banga became CEO of Mastercard, he noticed the company&apos;s slogan called it the heart of
              commerce. Yet inside the building, everyone talked about Visa and American Express, rivals competing
              for the small share of payments that were already electronic.
            </p>
            <p className="mt-[28px]">
              Almost no one talked about the real competitor: cash, which at the time handled more than 85% of
              consumer transactions worldwide.¹
            </p>
          </div>
          <div className="flex w-full flex-col gap-[6px] border-l-2 border-[#ff6600] py-[4px] pl-[20px]">
            <span className="font-body text-[17px] font-normal text-[#a1a1aa] leading-[1.2]">
              So Banga rewrote the mission in two words:
            </span>
            <span className="font-display text-[40px] font-medium tracking-[-1px] text-[#fafafa] italic leading-[1.2]">
              kill cash.
            </span>
          </div>
          <p className={body}>Mastercard stopped fighting over the 15% and went after the 85%.</p>
        </div>
        <div className="flex w-[500px] shrink-0 flex-col gap-[12px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/landing/generated-1.png"
            alt="Burning cash"
            className="h-[540px] w-full rounded-[12px] border border-[#ffffff1a] object-cover"
          />
          <span className="font-mono text-[11px] font-normal tracking-[1px] text-[#71717a] leading-[1.2]">
            FIG. 01 — THE REAL COMPETITOR WAS NEVER VISA.
          </span>
        </div>
      </div>

      {/* Market */}
      <div className="flex w-full flex-col gap-[28px]">
        <div className="flex w-full gap-[80px]">
          <span className="min-w-0 flex-1 font-mono text-[12px] font-normal tracking-[1.5px] text-[#71717a] leading-[1.2]">
            THE AGENT MARKET, TODAY
          </span>
          <div className={`w-[620px] shrink-0 ${body}`}>
            <p>AI agents are in the same spot today.</p>
            <p className="mt-[28px]">
              In the US, the most AI-native market on earth, 64% of adults use AI, a number that barely moved from
              61% a year earlier.² Only about 24% of AI users use an agent regularly.³ That means roughly 15% of
              American adults rely on AI agents.⁴ Worldwide, consumer AI reaches about 24% of the population, so
              roughly 3 in 4 people don&apos;t use AI at all.²
            </p>
            <p className="mt-[28px]">
              The industry is building evals, frameworks and dashboards for the 15% who already use agents. The
              bigger market is everyone who tried once, got stuck, and never came back.
            </p>
          </div>
        </div>
        <div className="flex h-[88px] w-full gap-[4px]">
          <div className="flex w-[174px] shrink-0 flex-col justify-between rounded-[10px_2px_2px_10px] bg-[#27272a] p-[16px]">
            <span className="font-display text-[24px] font-medium text-[#fafafa] leading-[1.2]">15%</span>
            <span className="font-mono text-[11px] font-normal text-[#9f9fa9] leading-[1.2]">already use agents</span>
          </div>
          <div
            className="flex min-w-0 flex-1 items-end justify-between rounded-[2px_10px_10px_2px] p-[16px]"
            style={{ background: 'linear-gradient(90deg, #ff6600 0%, #ff660033 100%)' }}
          >
            <div className="flex flex-col gap-[6px]">
              <span className="font-display text-[24px] font-medium text-[#18181b] leading-[1.2]">85%</span>
              <span className="font-mono text-[11px] font-normal text-[#18181b] leading-[1.2]">
                tried once, got stuck, never came back
              </span>
            </div>
            <span className="font-mono text-[11px] font-normal tracking-[1px] text-[#ffd1b3] leading-[1.2]">
              ← NOBODY IS BUILDING FOR THEM
            </span>
          </div>
        </div>
        <div className="flex w-full gap-[4px] font-mono text-[11px] font-normal text-[#71717a] leading-[1.2]">
          <span className="w-[174px] shrink-0">Evals · frameworks · dashboards</span>
          <span className="min-w-0 flex-1">The drop-off: people who tried an agent once and never came back</span>
        </div>
      </div>

      {/* Mission */}
      <div className="flex w-full flex-col items-center gap-[16px] border-y border-[#ffffff1a] py-[56px]">
        <span className="font-mono text-[12px] font-normal tracking-[2px] text-[#71717a] leading-[1.2]">OUR MISSION</span>
        <span className="font-display text-[96px] leading-[1.2] font-medium tracking-[-3px] text-[#ff6600]">
          Kill the drop-off.
        </span>
      </div>

      {/* Sources */}
      <div className="flex w-full flex-col gap-[10px]">
        <span className="font-mono text-[12px] leading-[1.6] font-normal tracking-[1.5px] text-[#71717a]">SOURCES</span>
        <p className={source}>
          ¹ Carolyn Dewar, Scott Keller and Vikram Malhotra, CEO Excellence: The Six Mindsets That Distinguish the Best
          Leaders from the Rest (Scribner, 2022). Figures as reported in the book for that historical period.
        </p>
        <p className={source}>
          ² Menlo Ventures, 2026: The State of Consumer AI, survey of 5,067 US adults conducted with Morning Consult,
          July 2026. menlovc.com/perspective/2026-the-state-of-consumer-ai
        </p>
        <p className={source}>
          ³ Same Menlo Ventures report, as compiled by Digital Applied, &quot;What People Let AI Agents Access: 2026
          Survey Numbers&quot; (Sept 2026).
        </p>
        <p className={source}>
          ⁴ itera.ai estimate: 64% of US adults using AI × 24% of AI users using an agent regularly ≈ 15%.
        </p>
      </div>
    </section>
  )
}
