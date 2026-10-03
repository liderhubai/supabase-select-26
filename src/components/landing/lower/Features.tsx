import { ArrowDown, Check, CircleCheck, CircleX, GitPullRequestArrow, MessageSquare, Search, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Eyebrow } from './Eyebrow'

function Card({ className, title, desc, children }: { className?: string; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className={cn('flex flex-col gap-[28px] overflow-hidden rounded-[16px] border border-[#ffffff1a] bg-[#111113] p-[28px]', className)}>
      <div className="flex w-full flex-col gap-[8px]">
        <h3 className="font-display text-[22px] leading-[1.2] font-medium text-[#fafafa]">{title}</h3>
        <p className="font-body text-[15px] leading-[1.55] text-[#9f9fa9]">{desc}</p>
      </div>
      {children}
    </div>
  )
}

type DiffLine = { n: string; sign: string; text: string; kind: 'ctx' | 'del' | 'add'; reason?: string }
const diff: DiffLine[] = [
  { n: '12', sign: ' ', text: 'You are the receptionist for Almeida & Costa Law.', kind: 'ctx' },
  { n: '13', sign: '-', text: 'When users ask about scheduling, share office hours.', kind: 'del' },
  { n: '14', sign: '+', text: 'When users ask to reschedule, check the calendar', kind: 'add', reason: '#214 · Marina' },
  { n: '15', sign: '+', text: 'and offer the next three open slots.', kind: 'add' },
  { n: '16', sign: ' ', text: "Always confirm the client's name and case number.", kind: 'ctx' },
  { n: '17', sign: '+', text: 'If the request is unclear, ask one clarifying question.', kind: 'add', reason: '#219 #223 · 3 similar' },
]
const lineStyles = {
  ctx: { bg: 'bg-transparent', sign: 'text-[#52525b]', text: 'text-[#a1a1aa]' },
  del: { bg: 'bg-[#ef444414]', sign: 'text-[#ef4444]', text: 'text-[#fecaca]' },
  add: { bg: 'bg-[#22c55e14]', sign: 'text-[#22c55e]', text: 'text-[#bbf7d0]' },
}

function DiffsCard() {
  return (
    <Card className="h-[480px] flex-1" title="Prompt diffs with reasons." desc="Every changed line links back to the feedback that caused it. No black-box rewrites.">
      <div className="flex w-full flex-1 flex-col overflow-hidden rounded-[10px] border border-[#ffffff14] bg-[#09090b]">
        <div className="flex w-full justify-between border-b border-[#ffffff14] px-[14px] py-[10px] font-mono text-[11px]">
          <span className="text-[#d4d4d8]">receptionist.prompt</span>
          <span className="whitespace-pre text-[#71717a]">v12 → v13  +3 −1</span>
        </div>
        <div className="flex w-full flex-1 flex-col py-[8px]">
          {diff.map((l) => {
            const s = lineStyles[l.kind]
            return (
              <div key={l.n} className={cn('flex w-full items-center gap-[12px] px-[14px] py-[6px]', s.bg)}>
                <span className="w-[18px] shrink-0 font-mono text-[11px] text-[#52525b]">{l.n}</span>
                <span className={cn('w-[7px] shrink-0 whitespace-pre font-mono text-[11px]', s.sign)}>{l.sign}</span>
                <span className={cn('flex-1 font-mono text-[12px]', s.text)}>{l.text}</span>
                {l.reason && (
                  <span className="flex shrink-0 items-center gap-[6px] rounded-[6px] border border-[#ff660040] bg-[#ff66001f] px-[8px] py-[3px]">
                    <MessageSquare className="size-[11px] text-[#ff6600]" />
                    <span className="font-mono text-[10px] text-[#ffd1b3]">{l.reason}</span>
                  </span>
                )}
              </div>
            )
          })}
        </div>
        <div className="flex w-full items-center gap-[10px] border-t border-[#ffffff14] bg-[#ff66000a] px-[14px] py-[12px]">
          <GitPullRequestArrow className="size-[14px] shrink-0 text-[#ff6600]" />
          <span className="font-mono text-[11px] text-[#ffd1b3]">Why: 3 feedbacks consolidated · optimized against v12 · 48/50 synthetic tests passed</span>
        </div>
      </div>
    </Card>
  )
}

function StatusPill({ color, bg, label }: { color: string; bg: string; label: string }) {
  return (
    <span className="flex items-center gap-[6px] rounded-full px-[10px] py-[4px]" style={{ background: bg }}>
      <span className="size-[6px] rounded-full" style={{ background: color }} />
      <span className="font-mono text-[11px]" style={{ color }}>{label}</span>
    </span>
  )
}

function StagingCard() {
  return (
    <Card className="h-[480px] w-[400px] shrink-0" title="Staging for prompts." desc="Nothing reaches users until a human approves it.">
      <div className="flex w-full flex-1 flex-col justify-end gap-[10px]">
        <div className="flex w-full items-center justify-between rounded-[10px] border border-[#ff660066] bg-[#ff66000f] p-[16px]">
          <div className="flex flex-col gap-[4px]">
            <span className="font-mono text-[11px] text-[#71717a]">STAGING</span>
            <span className="font-display text-[18px] font-medium text-[#fafafa]">prompt v13</span>
          </div>
          <StatusPill color="#eab308" bg="#eab3081f" label="Awaiting review" />
        </div>
        <div className="flex w-full items-center justify-center gap-[8px]">
          <ArrowDown className="size-[14px] text-[#52525b]" />
          <span className="font-mono text-[11px] text-[#52525b]">human approval required</span>
        </div>
        <div className="flex w-full items-center justify-between rounded-[10px] border border-[#ffffff14] bg-[#09090b] p-[16px]">
          <div className="flex flex-col gap-[4px]">
            <span className="font-mono text-[11px] text-[#71717a]">PRODUCTION</span>
            <span className="font-display text-[18px] font-medium text-[#fafafa]">prompt v12</span>
          </div>
          <StatusPill color="#22c55e" bg="#22c55e1f" label="Live" />
        </div>
        <div className="flex w-full gap-[8px] pt-[4px]">
          <span className="flex flex-1 justify-center rounded-full border border-[#ffffff26] py-[10px] font-body text-[13px] font-medium text-[#fafafa]">Review diff</span>
          <span className="flex flex-1 items-center justify-center gap-[6px] rounded-full bg-[#ff6600] py-[10px]">
            <Check className="size-[14px] text-[#18181b]" />
            <span className="font-body text-[13px] font-medium text-[#18181b]">Promote</span>
          </span>
        </div>
      </div>
    </Card>
  )
}

const failed = new Set([17, 38])
const scenarios = [
  { ok: true, label: 'Reschedule a hearing' },
  { ok: true, label: 'New client intake' },
  { ok: false, label: 'Angry client, wrong case no.' },
  { ok: true, label: 'Asks for fees in Spanish' },
]

function TestsCard() {
  return (
    <Card className="h-[440px] flex-1" title="Synthetic test battery." desc="See how the new version handles real scenarios before it goes live.">
      <div className="flex w-full flex-1 flex-col justify-end gap-[12px]">
        <div className="flex w-full items-end justify-between">
          <span className="font-display text-[36px] leading-[1.2] font-medium text-[#fafafa]">48/50</span>
          <span className="font-mono text-[11px] text-[#22c55e]">v13 vs v12: +9 passed</span>
        </div>
        <div className="flex h-[6px] w-full gap-[2px]">
          {Array.from({ length: 50 }, (_, i) => (
            <span key={i} className={cn('h-[6px] flex-1 rounded-[1px]', failed.has(i) ? 'bg-[#ef4444]' : 'bg-[#22c55e]')} />
          ))}
        </div>
        <div className="flex w-full flex-col pt-[8px]">
          {scenarios.map((s) => (
            <div key={s.label} className="flex w-full items-center gap-[10px] border-b border-[#ffffff0f] py-[9px]">
              {s.ok ? <CircleCheck className="size-[14px] shrink-0 text-[#22c55e]" /> : <CircleX className="size-[14px] shrink-0 text-[#ef4444]" />}
              <span className="flex-1 font-body text-[13px] text-[#d4d4d8]">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

const traces = [
  { bar: '#ef4444', t: '14:02:11', who: 'AI', v: 'v12', msg: 'Our office is open Monday…' },
  { bar: '#ff6600', t: '14:02:40', who: 'HUMAN', v: '—', msg: '👎 She asked to reschedule…' },
  { bar: '#22c55e', t: '14:05:03', who: 'AI', v: 'v13', msg: 'I can move it. Friday 10am…' },
  { bar: '#71717a', t: '14:05:20', who: 'USER', v: '—', msg: 'Friday 10am works, thanks!' },
]

function TracesCard() {
  return (
    <Card className="h-[440px] flex-1" title="Full trace history." desc="Every input and output, from both AI and humans, versioned and searchable.">
      <div className="flex w-full flex-1 flex-col justify-end gap-[8px]">
        <div className="flex w-full items-center gap-[8px] rounded-[8px] border border-[#ffffff14] bg-[#09090b] px-[12px] py-[8px]">
          <Search className="size-[13px] text-[#71717a]" />
          <span className="whitespace-pre font-mono text-[11px] text-[#a1a1aa]">reschedule  version:v12</span>
        </div>
        {traces.map((r) => (
          <div key={r.t} className="flex w-full items-center gap-[10px] rounded-[6px] bg-[#ffffff05] px-[10px] py-[8px]">
            <span className="h-[14px] w-[2px] shrink-0" style={{ background: r.bar }} />
            <span className="font-mono text-[11px] text-[#71717a]">{r.t}</span>
            <span className="w-[40px] shrink-0 font-mono text-[11px] text-[#d4d4d8]">{r.who}</span>
            <span className="w-[22px] shrink-0 font-mono text-[11px] text-[#71717a]">{r.v}</span>
            <span className="min-w-0 flex-1 font-body text-[12px] text-[#a1a1aa]">{r.msg}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

const roles = [
  { initial: 'M', color: '#2b91ff', label: 'MARINA · MANAGER', quote: '"It should offer Friday slots."' },
  { initial: 'R', color: '#a855f7', label: 'RAFAEL · REVIEWER', quote: '"Too formal for WhatsApp."' },
]

function PeopleCard() {
  return (
    <Card className="h-[440px] flex-1" title="Built for the people who see the problem." desc="Managers and reviewers give feedback. itera does the prompt engineering.">
      <div className="flex w-full flex-1 flex-col justify-end gap-[10px]">
        {roles.map((r) => (
          <div key={r.initial} className="flex w-full gap-[12px] rounded-[10px] border border-[#ffffff14] bg-[#09090b] p-[12px]">
            <span className="flex size-[32px] shrink-0 items-center justify-center rounded-full font-body text-[13px] font-medium text-[#fafafa]" style={{ background: r.color }}>
              {r.initial}
            </span>
            <div className="flex flex-1 flex-col gap-[3px]">
              <span className="font-mono text-[11px] text-[#71717a]">{r.label}</span>
              <span className="font-body text-[13px] leading-[1.45] text-[#e4e4e7]">{r.quote}</span>
            </div>
          </div>
        ))}
        <div className="flex w-full items-center gap-[12px] rounded-[10px] border border-[#ff660052] bg-[#ff66001a] p-[12px]">
          <span className="flex size-[32px] shrink-0 items-center justify-center rounded-[8px] bg-[#ff6600]">
            <Sparkles className="size-[16px] text-[#18181b]" />
          </span>
          <span className="font-mono text-[12px] text-[#ffd1b3]">itera rewrites the prompt → v13</span>
        </div>
      </div>
    </Card>
  )
}

export function Features() {
  return (
    <section id="features" className="flex w-full flex-col gap-[56px] bg-[#09090b] px-[48px] py-[120px]">
      <div className="flex w-full items-end justify-between">
        <div className="flex flex-col gap-[20px]">
          <Eyebrow label="FEATURES" />
          <h2 className="font-display text-[56px] leading-[1.2] font-medium tracking-[-1.5px] text-[#fafafa]">No black-box rewrites.</h2>
        </div>
        <p className="w-[360px] font-body text-[17px] leading-[1.6] text-[#a1a1aa]">
          Humans stay in charge of what ships. itera does the prompt engineering.
        </p>
      </div>
      <div className="flex w-full gap-[16px]">
        <DiffsCard />
        <StagingCard />
      </div>
      <div className="flex w-full gap-[16px]">
        <TestsCard />
        <TracesCard />
        <PeopleCard />
      </div>
    </section>
  )
}
