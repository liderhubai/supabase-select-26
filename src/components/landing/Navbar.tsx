import Link from 'next/link'
import { Logo } from '@/components/app/Logo'
import { CornerPlus } from './CornerPlus'

const NAV = [
  { label: 'Insight', href: '#insight' },
  { label: 'Problem', href: '#problem' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'Built with', href: '#built-with' },
]

function GithubMark() {
  return (
    <svg viewBox="0 0 16 16" className="h-[16px] w-[16px]" fill="#fafafa" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 flex w-full flex-col items-center bg-[#09090b]">
      <div className="relative flex w-[1280px] flex-col px-[48px]">
        {/* bordas laterais + marcadores */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-0 h-[64px] w-[1px] bg-[#ffffff33]" />
          <div className="absolute top-0 left-[1279px] h-[64px] w-[1px] bg-[#ffffff33]" />
          <CornerPlus className="top-[53.5px] left-[-11px]" />
          <CornerPlus className="top-[53.5px] left-[1269px]" />
        </div>
        <div className="flex">
          <div className="flex h-[64px] w-[105.52px] items-center">
            <Link href="/" aria-label="itera.ai">
              <Logo />
            </Link>
          </div>
          <nav className="flex h-[64px] w-[804.22px] items-center pl-[30px]">
            {NAV.map((item) => (
              <a key={item.label} href={item.href} className="flex items-center justify-center px-[6px]">
                <span className="flex h-[32px] items-center rounded-full px-[12px] py-[6px] font-body text-[14px] leading-[1.43] font-medium text-[#fafafa] transition-colors hover:bg-[#ffffff0d]">
                  {item.label}
                </span>
              </a>
            ))}
          </nav>
          <div className="flex h-[64px] w-[274.27px] items-center justify-end">
            <div className="flex items-center gap-[8px]">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-[38px] items-center gap-[8px] rounded-full px-[12px] hover:bg-[#ffffff0d]"
              >
                <GithubMark />
                <span className="font-mono text-[12px] leading-[1.33] font-medium text-[#fafafa]">GitHub</span>
              </a>
              <div className="flex items-center gap-[8px]">
                <a
                  href="#how-it-works"
                  className="flex h-[32px] items-center justify-center rounded-full border border-[#ffffff1a] bg-[#09090b] px-[14px] font-body text-[12px] leading-[1.33] font-semibold whitespace-nowrap text-[#fafafa] hover:bg-[#18181b]"
                >
                  See the loop
                </a>
                <Link
                  href="/app"
                  className="flex h-[32px] items-center justify-center rounded-full bg-[#ff6600] px-[14px] font-body text-[12px] leading-[1.33] font-semibold whitespace-nowrap text-[#18181b] hover:bg-[#ff7a1f]"
                >
                  Start iterating
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
