import Link from 'next/link'
import { Logo } from '@/components/app/Logo'
import { LINE_COLOR } from './CornerPlus'

const NAV = [
  { label: 'Insight', href: '#insight' },
  { label: 'Problem', href: '#problem' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'Built with', href: '#built-with' },
]

const NAV_HEIGHT = 64

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 flex w-full flex-col items-center bg-[#09090b]" style={{ height: NAV_HEIGHT }}>
      {/* Divider inferior: linha de 1px em toda a largura da tela, no último pixel da nav (y=63). */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[1px]" style={{ background: LINE_COLOR }} />

      <div className="relative flex w-[1280px] px-[48px]" style={{ height: NAV_HEIGHT }}>
        {/* Linhas laterais da coluna (x=0 e x=1279), encostando no divider inferior. */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-y-0 left-0 w-[1px]" style={{ background: LINE_COLOR }} />
          <div className="absolute inset-y-0 right-0 w-[1px]" style={{ background: LINE_COLOR }} />
        </div>

        <div className="flex h-full w-full items-center">
          <Link href="/" aria-label="itera.ai" className="flex h-full items-center">
            <Logo />
          </Link>
          <nav className="flex h-full flex-1 items-center pl-[30px]">
            {NAV.map((item) => (
              <a key={item.label} href={item.href} className="flex items-center justify-center px-[6px]">
                <span className="flex h-[32px] items-center rounded-full px-[12px] py-[6px] font-body text-[14px] leading-[1.43] font-medium whitespace-nowrap text-[#fafafa] transition-colors hover:bg-[#ffffff0d]">
                  {item.label}
                </span>
              </a>
            ))}
          </nav>
          <div className="flex h-full items-center gap-[8px]">
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
    </header>
  )
}
