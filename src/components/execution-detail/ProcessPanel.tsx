'use client'

import { useState } from 'react'
import { Braces, Gauge, Inbox, Layers, Send, Sparkles, TriangleAlert, type LucideIcon } from 'lucide-react'
import { cn, formatMs } from '@/lib/utils'
import { confidenceTone } from '@/components/app/ConfidenceBadge'
import type { ExecutionDetailRow } from './ExecutionDetail'

type Step = { icon: LucideIcon; iconClass: string; title: string; time?: string; desc: string; detail?: React.ReactNode }

function buildSteps(ex: ExecutionDetailRow): Step[] {
  const history = ex.input?.messages ?? []
  const received = history.at(-1)
  const message = ex.messages[0]
  const steps: Step[] = [
    {
      icon: Inbox,
      iconClass: 'text-info',
      title: 'Message received',
      time: '+0ms',
      desc: typeof received?.content === 'string' ? `“${received.content}”` : '—',
    },
    {
      icon: Layers,
      iconClass: 'text-muted-foreground',
      title: 'Context assembled',
      desc: `${history.length - 1} previous messages · system prompt v${ex.prompt_versions?.version ?? '—'} (${(ex.input?.instructions ?? '').length.toLocaleString('en-US')} chars) · ${(ex.input_tokens ?? 0).toLocaleString('en-US')} input tokens`,
    },
    {
      icon: Sparkles,
      iconClass: 'text-accent',
      title: `Model call · ${ex.model}`,
      desc: 'Streamed reply with low effort to keep latency and cost down.',
    },
  ]
  if (ex.error) {
    steps.push({ icon: TriangleAlert, iconClass: 'text-error', title: 'Execution failed', time: `+${formatMs(ex.latency_ms)}`, desc: ex.error })
    return steps
  }
  steps.push({
    icon: Send,
    iconClass: 'text-success',
    title: 'Reply generated',
    time: `+${formatMs(ex.latency_ms)}`,
    desc: `${(ex.output_tokens ?? 0).toLocaleString('en-US')} output tokens · finish_reason: ${ex.finish_reason ?? '—'}`,
  })
  steps.push({
    icon: Gauge,
    iconClass: 'text-warning',
    title: 'Confidence scored',
    time: 'after reply',
    desc: message?.confidence == null ? 'Scoring…' : (message.confidence_reason ?? ''),
    detail:
      message?.confidence != null ? (
        <div className="flex flex-col gap-[6px]">
          <span className={cn('w-fit rounded-full px-[8px] py-[2px] font-mono text-[11px] font-medium', confidenceTone(message.confidence))}>
            {message.confidence}% confidence
          </span>
          {message.confidence_issues?.map((i, n) => (
            <div key={n} className="flex flex-col gap-[2px] rounded-[6px] border border-border bg-[#050506] px-[12px] py-[8px] font-mono text-[11.5px]">
              <span className="text-accent-foreground">
                [{i.type}] “{i.excerpt}”
              </span>
              <span className="text-muted-foreground">{i.explanation}</span>
            </div>
          ))}
        </div>
      ) : undefined,
  })
  return steps
}

export function ProcessPanel({ ex }: { ex: ExecutionDetailRow }) {
  const [json, setJson] = useState(false)
  const steps = buildSteps(ex)
  return (
    <section className="flex h-full w-[500px] shrink-0 flex-col overflow-hidden rounded-[20px] border border-border bg-surface">
      <div className="flex w-full shrink-0 items-center justify-between border-b border-border px-[20px] py-[14px]">
        <div className="flex flex-col gap-[2px]">
          <h2 className="font-display text-[16px] font-medium text-foreground">What the agent did</h2>
          <p className="text-[13px] text-muted-foreground">
            {steps.length} steps · {formatMs(ex.latency_ms)} total
          </p>
        </div>
        <button
          type="button"
          onClick={() => setJson((j) => !j)}
          aria-pressed={json}
          className={cn('flex h-[36px] items-center justify-center gap-[6px] rounded-full px-[16px] hover:bg-surface-raised', json && 'bg-surface-raised')}
        >
          <Braces size={16} className="text-muted-foreground" />
          <span className="text-[14px] font-medium text-muted-foreground">{json ? 'Steps' : 'JSON'}</span>
        </button>
      </div>

      {json ? (
        <pre className="min-h-0 flex-1 overflow-auto bg-[#050506] p-[20px] font-mono text-[11.5px] leading-[1.5] whitespace-pre-wrap text-muted-foreground">
          {JSON.stringify(
            {
              id: ex.id,
              model: ex.model,
              latency_ms: ex.latency_ms,
              input_tokens: ex.input_tokens,
              output_tokens: ex.output_tokens,
              finish_reason: ex.finish_reason,
              error: ex.error,
              input: ex.input,
              output: ex.output,
            },
            null,
            2,
          )}
        </pre>
      ) : (
        <ol className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto px-[20px] py-[18px]">
          {steps.map((step, i) => {
            const last = i === steps.length - 1
            const Icon = step.icon
            return (
              <li key={step.title} className="relative flex w-full shrink-0 gap-[14px] overflow-hidden">
                <div className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface-raised">
                  <Icon size={13} className={step.iconClass} />
                </div>
                <div className={cn('flex min-w-0 flex-1 flex-col gap-[6px] pt-[4px]', !last && 'pb-[20px]')}>
                  <div className="flex w-full items-center gap-[8px]">
                    <span className="flex-1 text-[14px] font-medium text-foreground">{step.title}</span>
                    {step.time && <span className="font-mono text-[11px] text-subtle-foreground">{step.time}</span>}
                  </div>
                  <p className="text-[13px] leading-[1.5] break-words text-muted-foreground">{step.desc}</p>
                  {step.detail}
                </div>
                {!last && <span className="absolute top-[32px] left-[13.5px] h-[800px] w-px bg-border-strong" />}
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
