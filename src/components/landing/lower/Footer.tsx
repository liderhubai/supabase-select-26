import Link from 'next/link'
import { Logo } from '@/components/app/Logo'
import { LINE_COLOR } from '../CornerPlus'

/** Só links para seções que existem na própria landing. */
const LINKS: { label: string; href: string }[] = [
  { label: 'Insight', href: '#insight' },
  { label: 'Problem', href: '#problem' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'Built with', href: '#built-with' },
]

const linkClass =
  'font-body text-[14px] leading-[1.5] whitespace-nowrap text-[#99a1af] transition-colors hover:text-[#fafafa]'

/** Linha de 1px em toda a largura da tela, fechando a coluna antes do footer. */
export function FooterDivider() {
  return <div className="h-[1px] w-full" style={{ background: LINE_COLOR }} />
}

export function Footer() {
  return (
    <div className="flex w-full flex-col items-center">
      <footer className="flex w-[1280px] items-center justify-between px-[48px] py-[40px]">
        <div className="flex flex-col gap-[12px]">
          <Logo />
          <p className="font-body text-[14px] leading-[1.6] text-[#99a1af]">
            © 2026 itera.ai · Built at Supabase Select Hackathon 2026 · San Francisco
          </p>
        </div>
        <nav className="flex items-center gap-[24px]">
          {LINKS.map((l) => (
            <a key={l.label} href={l.href} className={linkClass}>
              {l.label}
            </a>
          ))}
          <Link href="/app" className={linkClass}>
            Start iterating
          </Link>
        </nav>
      </footer>
    </div>
  )
}
