import { CircleAlert, CodeXml, Eye, LogOut, MessageSquareWarning, Unlink, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LandingEyebrow } from './Eyebrow'

function RoleCard({
  icon: Icon,
  role,
  statement,
  danger,
  children,
}: {
  icon: LucideIcon
  role: string
  statement: string
  danger?: boolean
  children?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'flex h-[280px] min-w-0 flex-1 flex-col justify-between rounded-[12px] border bg-[#111113] p-[24px]',
        danger ? 'border-[#ef444466]' : 'border-[#ffffff1a]',
      )}
    >
      <div className="flex w-full items-center justify-between">
        <div
          className={cn(
            'flex h-[40px] w-[40px] items-center justify-center rounded-[10px]',
            danger ? 'bg-[#ef44441f]' : 'bg-[#ffffff0d]',
          )}
        >
          <Icon className={cn('h-[20px] w-[20px]', danger ? 'text-[#ef4444]' : 'text-[#d4d4d8]')} />
        </div>
        <span className="font-mono text-[11px] font-normal tracking-[1px] text-[#71717a] leading-[1.2]">{role}</span>
      </div>
      {children}
      <p
        className={cn(
          'font-display text-[22px] leading-[1.25] font-medium',
          danger ? 'text-[#ef4444]' : 'text-[#fafafa]',
        )}
      >
        {statement}
      </p>
    </div>
  )
}

function Break() {
  return (
    <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center">
      <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-[#ef444480] bg-[#09090b]">
        <Unlink className="h-[14px] w-[14px] text-[#ef4444]" />
      </div>
    </div>
  )
}

const DOTS = Array.from({ length: 50 }, (_, i) => Math.round(255 - (i * (255 - 0x2b)) / 49))

const STATS = [
  { value: '[X]', label: 'law firms running LíderHub agents' },
  { value: '[X]%', label: 'of users never return after one bad reply' },
  { value: '[X] wks', label: 'from a user complaint to a prompt fix' },
]

export function Problem() {
  return (
    <section id="problem" className="flex w-full flex-col gap-[64px] bg-[#09090b] px-[48px] py-[120px]">
      <div className="flex w-full items-end gap-[80px]">
        <div className="flex min-w-0 flex-1 flex-col gap-[24px]">
          <LandingEyebrow>THE PROBLEM</LandingEyebrow>
          <h2 className="font-display text-[52px] leading-[1.08] font-medium tracking-[-1.5px] text-[#fafafa]">
            Users don&apos;t quit because AI is bad. They quit because nobody fixed it.
          </h2>
        </div>
        <p className="w-[360px] shrink-0 font-body text-[17px] leading-[1.65] font-normal text-[#a1a1aa]">
          Running AI agents for [X] law firms at LíderHub, we saw the same pattern again and again:
        </p>
      </div>

      <div className="flex w-full items-center">
        <RoleCard icon={MessageSquareWarning} role="01 · THE AGENT" statement="Misreads one message." danger>
          <div className="flex w-full flex-col items-end gap-[6px]">
            <div className="rounded-[10px_10px_2px_10px] bg-[#ff6600] px-[10px] py-[6px] font-body text-[12px] font-normal text-[#18181b] leading-[1.2]">
              Can we move my hearing to Friday?
            </div>
            <div className="flex w-full">
              <div className="rounded-[10px_10px_10px_2px] border border-[#ef444466] bg-[#ef44441f] px-[10px] py-[6px] font-body text-[12px] font-normal text-[#fca5a5] leading-[1.2]">
                Our office hours are 9am–6pm.
              </div>
            </div>
          </div>
        </RoleCard>
        <Break />
        <RoleCard icon={LogOut} role="02 · THE USER" statement="Gives up." />
        <Break />
        <RoleCard icon={Eye} role="03 · THE MANAGER" statement="Notices, but can't edit a prompt." />
        <Break />
        <RoleCard icon={CodeXml} role="04 · THE ENGINEER" statement="Can fix the prompt, but never sees the conversation." />
      </div>

      <div className="flex w-full flex-col gap-[16px]">
        <div className="flex w-full items-center justify-between">
          <span className="font-body text-[17px] font-normal text-[#d4d4d8] leading-[1.2]">
            Weeks go by, and the same mistake hits the next hundred users.
          </span>
          <span className="font-mono text-[11px] font-normal tracking-[1px] text-[#71717a] leading-[1.2]">
            WEEK 1 → WEEK 6 · ×100 USERS
          </span>
        </div>
        <div className="flex w-full justify-between">
          {DOTS.map((a, i) => (
            <span
              key={i}
              className="h-[12px] w-[12px] rounded-full"
              style={{ backgroundColor: `#ef4444${a.toString(16).padStart(2, '0')}` }}
            />
          ))}
        </div>
      </div>

      <div className="flex w-full border-t border-[#ffffff1a]">
        {STATS.map((s, i) => (
          <div
            key={s.value}
            className={cn(
              'flex min-w-0 flex-1 flex-col gap-[8px] pt-[32px] pr-[32px]',
              i > 0 && 'border-l border-[#ffffff1a] pl-[32px]',
            )}
          >
            <span className="font-display text-[44px] font-medium text-[#ff6600] leading-[1.2]">{s.value}</span>
            <span className="font-body text-[14px] leading-[1.5] font-normal text-[#9f9fa9]">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="flex w-full items-center gap-[16px] rounded-[12px] border border-[#ef444433] bg-[#ef44440f] px-[28px] py-[24px]">
        <CircleAlert className="h-[22px] w-[22px] shrink-0 text-[#ef4444]" />
        <span className="font-display text-[26px] font-medium text-[#fafafa] leading-[1.2]">
          The feedback loop is broken, and that is where users are lost.
        </span>
      </div>
    </section>
  )
}
