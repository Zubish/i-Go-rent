import type { ReactNode } from "react"
import { Navbar } from "@/components/home/navbar"

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  )
}
