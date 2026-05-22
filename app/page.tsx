import { Navbar } from "@/components/home/navbar"
import { HeroSection } from "@/components/home/hero-section"
import { CategoriesGrid } from "@/components/home/categories-grid"
import { FeaturedListings } from "@/components/home/featured-listings"
import { HowItWorks } from "@/components/home/how-it-works"
import { CtaSection } from "@/components/home/cta-section"
import { Footer } from "@/components/home/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <CategoriesGrid />
      <FeaturedListings />
      <HowItWorks />
      <CtaSection />
      <Footer />
    </main>
  )
}
