"use client"

import { useEffect, useState } from "react"
import { getRenterDashboardData, getHostDashboardData } from "@/app/actions/dashboard-actions"
import RenterDashboard from "@/components/dashboards/renter-dashboard"
import HostDashboard from "@/components/dashboards/host-dashboard"

export default function DashboardPage() {
  const [userType, setUserType] = useState<"renter" | "host" | null>(null)
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      // Get user type from auth context
      const userId = "current-user-id" // Should come from auth
      const type = "renter" // Should come from auth

      setUserType(type as "renter" | "host")

      if (type === "renter") {
        const data = await getRenterDashboardData(userId)
        setDashboardData(data)
      } else {
        const data = await getHostDashboardData(userId)
        setDashboardData(data)
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {userType === "renter" ? <RenterDashboard data={dashboardData} /> : <HostDashboard data={dashboardData} />}
    </div>
  )
}
