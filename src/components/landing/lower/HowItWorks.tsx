import { ArrowRight, RotateCcw, Sparkles, ThumbsDown, ThumbsUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Eyebrow } from './Eyebrow'

const steps = [
  { n: '1', title: 'Simulate', railH: 124, desc: 'Chat with your agent (receptionist, sales, support) right inside itera. Every conversation is real data.' },
  { n: '2', title: 'Observe', railH: 124, desc: 'Every turn becomes a trace: input, output, prompt version, model, latency. Click any log to open the full conversation.' },
  { n: '3', title: 'Flag', railH: 148, active: true, desc: 'Select any message, mark it 👍 or 👎, and explain what should have happened, in plain language. No prompt engineering required.' },
  { n: '4', title: 'Improve', railH: 148, desc: 'Feedback goes into a self-improvement queue. itera consolidates it and runs a prompt optimizer (GEPA-style) against the exact version that served that user.' },
  { n: '5', title: 'Test and ship', railH: 112, last: true, desc: 'The new version runs a battery of synthetic conversations. You review the diff, see why each change was made, and promote it from staging to production.' },
]

function Steps() {
  return (
    <div className="flex w-[460px] shrink-0 flex-col">
      {steps.map((s) => (
        <div key={s.n} className="flex w-full gap-[20px]">
          <div className="flex w-[32px] shrink-0 flex-col items-center" style={{ height: s.railH }}>
            <div
              className={cn(
                'flex size-[32px] shrink-0 items-center justify-center rounded-full border',
                s.active ? 'border-[#ff6600] bg-[#ff6600]' : 'border-[#ffffff26] bg-[#18181b]',
              )}
            >
              <span className={cn('font-mono text-[13px] font-medium', s.active ? 'text-[#18181b]' : 'text-[#fafafa]')}>{s.n}</span>
            </div>
            <div className={cn('w-px flex-1', s.last ? 'bg-transparent' : 'bg-[#ffffff1f]')} />
          </div>
          <div className={cn('flex flex-1 flex-col gap-[8px] pt-[4px]', !s.last && 'pb-[36px]')}>
            <span className={cn('font-display text-[22px] font-medium leading-[1.2]', s.active ? 'text-[#ff6600]' : 'text-[#fafafa]')}>{s.title}</span>
            <p className="font-body text-[15px] leading-[1.6] font-normal text-[#9f9fa9]">{s.desc}</p>
          </div>
        </div>
      ))}
      <div className="flex w-full items-center gap-[10px] pt-[20px] pl-[6px]">
        <RotateCcw className="size-[16px] shrink-0 text-[#ff6600]" />
        <span className="flex-1 font-mono text-[12px] text-[#ffd1b3]">Back to step 1. Every conversation teaches the agent.</span>
      </div>
    </div>
  )
}

function ProductMock() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-[16px] border border-[#ffffff1f] bg-[#111113] shadow-[0_30px_80px_#ff66001a]">
      <div className="flex w-full items-center justify-between border-b border-[#ffffff14] px-[18px] py-[14px]">
        <div className="flex gap-[6px]">
          <span className="size-[10px] rounded-full bg-[#3f3f46]" />
          <span className="size-[10px] rounded-full bg-[#3f3f46]" />
          <span className="size-[10px] rounded-full bg-[#3f3f46]" />
        </div>
        <div className="flex items-center gap-[8px]">
          <span className="font-body text-[13px] font-medium text-[#fafafa]">Receptionist agent</span>
          <span className="rounded-[6px] bg-[#ffffff0f] px-[8px] py-[2px] font-mono text-[11px] text-[#9f9fa9]">prompt v12 · production</span>
        </div>
        <div className="flex items-center gap-[6px]">
          <span className="size-[6px] rounded-full bg-[#22c55e]" />
          <span className="font-mono text-[11px] text-[#22c55e]">Simulating</span>
        </div>
      </div>

      <div className="flex w-full flex-col gap-[16px] px-[28px] pt-[24px] pb-[28px]">
        <div className="flex w-full justify-center">
          <span className="font-mono text-[10px] tracking-[1px] text-[#52525b]">TODAY · SIMULATED SESSION #1,284</span>
        </div>

        <div className="flex w-full flex-col gap-[6px]">
          <div className="w-[380px] rounded-[14px_14px_14px_4px] bg-[#1c1c1f] px-[14px] py-[10px]">
            <p className="font-body text-[14px] leading-[1.5] text-[#e4e4e7]">Hi, this is Almeida &amp; Costa Law. How can I help you today?</p>
          </div>
        </div>

        <div className="flex w-full flex-col items-end gap-[6px]">
          <div className="rounded-[14px_14px_4px_14px] bg-[#ff6600] px-[14px] py-[10px]">
            <p className="font-body text-[14px] leading-[1.5] text-[#18181b]">Hi! Can we move my hearing prep call to Friday?</p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-[6px]">
          <div className="w-[380px] rounded-[14px_14px_14px_4px] border border-[#ef4444] bg-[#ef444414] px-[14px] py-[10px]">
            <p className="font-body text-[14px] leading-[1.5] text-[#e4e4e7]">Our office is open Monday to Friday, 9am to 6pm. Is there anything else I can help with?</p>
          </div>
          <div className="flex items-center gap-[6px]">
            <span className="flex size-[28px] items-center justify-center rounded-[8px] bg-[#ffffff0d]">
              <ThumbsUp className="size-[14px] text-[#9f9fa9]" />
            </span>
            <span className="flex size-[28px] items-center justify-center rounded-[8px] bg-[#ef4444]">
              <ThumbsDown className="size-[14px] text-[#fafafa]" />
            </span>
            <span className="font-mono text-[11px] text-[#71717a]">trace_8f2a · gpt-4.1 · v12 · 1.4s</span>
          </div>
        </div>

        <div className="flex w-full flex-col gap-[12px] rounded-[12px] border border-[#ff660066] bg-[#18181b] p-[18px]">
          <div className="flex w-full items-center justify-between">
            <span className="font-body text-[13px] font-medium text-[#fafafa]">What should have happened?</span>
            <div className="flex items-center gap-[8px]">
              <span className="flex size-[22px] items-center justify-center rounded-full bg-[#2b91ff] font-body text-[11px] font-medium text-[#fafafa]">M</span>
              <span className="font-body text-[12px] text-[#9f9fa9]">Marina · Office manager</span>
            </div>
          </div>
          <div className="w-full rounded-[8px] border border-[#ffffff1a] bg-[#09090b] p-[12px]">
            <p className="font-body text-[13px] leading-[1.55] text-[#d4d4d8]">
              She asked to reschedule, not for our hours. The agent should check the calendar and offer the open Friday slots.
            </p>
          </div>
          <div className="flex w-full items-center justify-between">
            <span className="font-mono text-[11px] text-[#71717a]">Plain language. No prompt engineering.</span>
            <span className="flex items-center gap-[6px] rounded-full bg-[#ff6600] px-[14px] py-[8px]">
              <span className="font-body text-[12px] font-medium text-[#18181b]">Send to improvement queue</span>
              <ArrowRight className="size-[14px] text-[#18181b]" />
            </span>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center gap-[10px] border-t border-[#ffffff14] bg-[#0d0d0f] px-[28px] py-[14px]">
        <Sparkles className="size-[14px] shrink-0 text-[#ff6600]" />
        <span className="font-mono text-[11px] text-[#9f9fa9]">Improvement queue: 7 feedbacks → consolidating → optimizing v12 → v13 (staging)</span>
      </div>
    </div>
  )
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="flex w-full flex-col gap-[72px] bg-[#09090b] px-[48px] py-[120px]">
      <div className="flex w-full flex-col items-center gap-[20px]">
        <Eyebrow label="HOW IT WORKS" />
        <h2 className="font-display text-[56px] leading-[1.2] font-medium tracking-[-1.5px] text-[#fafafa]">
          One loop, from bad reply to better agent.
        </h2>
      </div>
      <div className="flex w-full items-center gap-[64px]">
        <Steps />
        <ProductMock />
      </div>
    </section>
  )
}
