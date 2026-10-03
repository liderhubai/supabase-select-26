import Link from 'next/link'
import { Moon } from 'lucide-react'
import { Logo } from '@/components/app/Logo'
import { PlusMark } from './Divider'

const columns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Insight', href: '#insight' },
      { label: 'Problem', href: '#problem' },
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Features', href: '#features' },
      { label: 'Built with', href: '#built-with' },
      { label: 'Simulate a conversation', href: '/app' },
      { label: 'See the loop', href: '#how-it-works' },
      { label: 'Start iterating', href: '/app' },
      { label: 'Docs', href: '#' },
    ],
  },
  {
    title: 'The loop',
    links: ['Simulate', 'Observe', 'Flag', 'Improve', 'Test and ship', 'Prompt diffs', 'Trace history'].map((l) => ({
      label: l,
      href: l === 'Prompt diffs' || l === 'Trace history' ? '#features' : '#how-it-works',
    })),
  },
  {
    title: 'Built with',
    links: [
      { label: 'Supabase', href: 'https://supabase.com' },
      { label: 'Vercel AI SDK', href: 'https://ai-sdk.dev' },
      { label: 'GEPA optimizer', href: '#' },
    ],
  },
  { title: 'Socials', links: ['Github', 'LinkedIn', 'X', 'Discord', 'Product Hunt'].map((l) => ({ label: l, href: '#' })) },
  { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Security', 'Trust Center'].map((l) => ({ label: l, href: '#' })) },
]

export function FooterDivider() {
  return (
    <div className="relative h-px w-full bg-[#ffffff33]">
      <div className="absolute top-[-9.5px] left-1/2 h-[21px] w-[1302px] -translate-x-1/2">
        <PlusMark className="top-0 left-0" />
        <PlusMark className="top-0 right-0" />
      </div>
    </div>
  )
}

export function Footer() {
  return (
    <div className="flex w-full flex-col items-center">
      <footer className="flex items-center justify-center py-[48px]">
        <div className="flex flex-col pl-[48px]">
          <div className="flex w-[1232px] justify-between">
            <div className="flex h-[320px] w-[281.19px] flex-col pb-[44px]">
              <Logo className="w-full" />
              <div className="h-[20px] w-full" />
              <p className="w-full font-body text-[14px] leading-[1.6] text-[#99a1af]">
                © 2026 itera.ai
                <br />
                Built at Supabase Select Hackathon 2026 · San Francisco
              </p>
              <div className="h-[24px] w-full" />
              <button
                type="button"
                aria-label="Toggle theme"
                className="flex size-[40px] items-center justify-center rounded-full bg-[#09090b] shadow-[0_1px_2px_#0000000d] ring-1 ring-[#ffffff26] ring-inset"
              >
                <Moon className="size-[16px] text-[#fafafa]" strokeWidth={1.33} />
              </button>
            </div>
            <div className="flex w-[873.27px] gap-[32px]">
              {columns.map((c) => (
                <div key={c.title} className="flex h-[320px] flex-1 flex-col gap-[16px]">
                  <h3 className="font-body text-[16px] leading-[1.5] font-semibold text-[#fafafa]">{c.title}</h3>
                  <ul className="flex w-full flex-col gap-[8px]">
                    {c.links.map((l) => (
                      <li key={l.label} className="h-[24px]">
                        <Link href={l.href} className="font-body text-[16px] leading-[1.5] whitespace-nowrap text-[#99a1af] transition-colors hover:text-[#fafafa]">
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
