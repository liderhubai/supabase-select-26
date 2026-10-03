import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { SectionDivider } from '@/components/landing/CornerPlus'
import { LandingLower, LandingFooter } from '@/components/landing/lower/LandingLower'

export default function LandingPage() {
  return (
    <div className="relative min-h-screen w-full overflow-x-clip bg-[#09090b]">
      {/* Side Borders */}
      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-[1280px] -translate-x-1/2">
        <div className="absolute inset-y-0 left-0 w-[1px] bg-[#ffffff33]" />
        <div className="absolute inset-y-0 right-0 w-[1px] bg-[#ffffff33]" />
      </div>
      <Navbar />
      <main className="flex w-full flex-col items-center">
        <div className="flex w-[1280px] flex-col pb-[64px]">
          <Hero />
          <SectionDivider />
          <LandingLower />
        </div>
      </main>
      <LandingFooter />
    </div>
  )
}
