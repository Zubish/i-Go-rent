import type { ReactNode } from "react"
import { Navbar } from "@/components/home/navbar"
import { Footer } from "@/components/home/footer"

export default function MarketplaceLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  )
}
