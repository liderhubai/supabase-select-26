import { BuiltWith } from './BuiltWith'
import { ClosingCta } from './ClosingCta'
import { SectionDivider } from './Divider'
import { Features } from './Features'
import { Footer, FooterDivider } from './Footer'
import { HowItWorks } from './HowItWorks'

/** Seções 04–07 da landing (vão dentro do container de 1280px). */
export function LandingLower() {
  return (
    <>
      <SectionDivider />
      <HowItWorks />
      <SectionDivider />
      <Features />
      <SectionDivider />
      <BuiltWith />
      <SectionDivider />
      <ClosingCta />
    </>
  )
}

/** Divisor + footer em largura total (fora do container). */
export function LandingFooter() {
  return (
    <>
      <FooterDivider />
      <Footer />
    </>
  )
}
