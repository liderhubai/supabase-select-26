'use client'

import Link from 'next/link'
import { Fragment } from 'react'
import { useCurrentAgent } from '@/lib/queries'

export function TopBar({ crumbs }: { crumbs: { label: string; href?: string }[] }) {
  const { agent } = useCurrentAgent()
  const items = [{ label: agent?.name ?? 'Agent' }, ...crumbs]
  return (
    <header className="flex h-[56px] w-full shrink-0 items-center gap-[16px] border-b border-border bg-background px-[24px]">
      <nav className="flex min-w-0 items-center gap-[8px]">
        {items.map((c, i) => {
          const last = i === items.length - 1
          return (
            <Fragment key={`${c.label}-${i}`}>
              {i > 0 && <span className="font-mono text-[13px] text-subtle-foreground">/</span>}
              {c.href && !last ? (
                <Link href={c.href} className="truncate text-[14px] text-muted-foreground hover:text-foreground">
                  {c.label}
                </Link>
              ) : (
                <span className={last ? 'truncate text-[14px] font-medium text-foreground' : 'truncate text-[14px] text-muted-foreground'}>{c.label}</span>
              )}
            </Fragment>
          )
        })}
      </nav>
    </header>
  )
}
