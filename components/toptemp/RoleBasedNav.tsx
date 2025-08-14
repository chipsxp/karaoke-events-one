"use client"

import { useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { UserRole, getRolePermissions } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Mic, Music, Users, PlusCircle, Calendar, User } from "lucide-react"

interface RoleBasedNavProps {
  className?: string
}

export function RoleBasedNav({ className }: RoleBasedNavProps) {
  const { user } = useUser()
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user?.id) {
        try {
          const response = await fetch(`/api/user/role?userId=${user.id}`)
          const data = await response.json()
          setUserRole(data.role)
        } catch (error) {
          console.error("Error fetching user role:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchUserRole()
  }, [user?.id])

  if (loading) {
    return <div className="h-12 animate-pulse bg-gray-200 rounded" />
  }

  if (!userRole) {
    return null
  }

  const permissions = getRolePermissions(userRole)

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: User,
      show: permissions.canAccessDashboard,
    },
    {
      href: "/events",
      label: "Events",
      icon: Calendar,
      show: permissions.canViewAllEvents,
    },
    {
      href: "/events/create",
      label: "Create Event",
      icon: PlusCircle,
      show: permissions.canCreateEvents,
    },
    {
      href: "/profile",
      label: "Profile",
      icon: User,
      show: permissions.canManageProfile,
    },
  ].filter(item => item.show)

  return (
    <nav className={className}>
      <ul className="flex items-center space-x-4">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link href={item.href}>
              <Button
                variant="ghost"
                className="flex items-center space-x-2 hover:bg-purple-100 hover:text-purple-700 transition-colors"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Button>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function RoleBadge({ role }: { role: UserRole }) {
  const roleConfig = {
    KJ: {
      label: "Karaoke Host",
      icon: Mic,
      color: "bg-blue-100 text-blue-800",
    },
    KS: {
      label: "Karaoke Singer",
      icon: Music,
      color: "bg-green-100 text-green-800",
    },
    Promoter: {
      label: "Promoter",
      icon: Users,
      color: "bg-purple-100 text-purple-800",
    },
  }

  const config = roleConfig[role]
  const Icon = config.icon

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
    >
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </span>
  )
}