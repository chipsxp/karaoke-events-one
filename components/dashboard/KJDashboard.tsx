"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PlusCircle, Calendar, Users, Mic } from "lucide-react"

interface KJDashboardProps {
  userId: string
}

export default function KJDashboard({ userId }: KJDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">KJ Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your karaoke events and track your performance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for KJs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full" variant="default">
              <Link href="/events/create">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create New Event
              </Link>
            </Button>
            <Button asChild className="w-full" variant="outline">
              <Link href="/events">
                <Calendar className="h-4 w-4 mr-2" />
                View All Events
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Events</CardTitle>
            <CardDescription>Manage your karaoke nights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <Mic className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-muted-foreground mb-4">No events created yet</p>
              <Button asChild size="sm">
                <Link href="/events/create">Create Your First Event</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile Status</CardTitle>
            <CardDescription>Your KJ verification</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Verification Status</span>
                <span className="text-sm font-medium text-yellow-600">Pending</span>
              </div>
              <Button asChild size="sm" className="w-full">
                <Link href="/profile">Complete Profile</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}