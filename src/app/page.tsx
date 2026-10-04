import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { Insight } from '@/components/landing/Insight'
import { Problem } from '@/components/landing/Problem'
import { ColumnSideLines, SectionDivider } from '@/components/landing/CornerPlus'
import { LandingLower, LandingFooter } from '@/components/landing/lower/LandingLower'

export default function LandingPage() {
  return (
    <div className="relative min-h-screen w-full overflow-x-clip bg-[#09090b]">
      <Navbar />
      <main className="relative flex w-full flex-col items-center">
        {/* Linhas laterais da coluna: ficam ACIMA das seções (z-10) para aparecerem
            também sobre a imagem da hero e os fundos opacos de cada seção. */}
        <ColumnSideLines className="z-10" />
        <div className="flex w-[1280px] flex-col pb-[64px]">
          <Hero />
          <SectionDivider />
          <Insight />
          <SectionDivider />
          <Problem />
          <LandingLower />
        </div>
      </main>
      <LandingFooter />
    </div>
  )
}
