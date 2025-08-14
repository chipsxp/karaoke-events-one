"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Users, TrendingUp, Building, Star } from "lucide-react"

interface PromoterDashboardProps {
  userId: string
}

export default function PromoterDashboard({ userId }: PromoterDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Promoter Dashboard</h1>
        <p className="text-muted-foreground">
          Find events to promote and grow your business
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Find Events</CardTitle>
            <CardDescription>Discover events to promote</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full" variant="default">
              <Link href="/events">
                <TrendingUp className="h-4 w-4 mr-2" />
                Browse Events
              </Link>
            </Button>
            <Button asChild className="w-full" variant="outline">
              <Link href="/events?category=high-potential">
                <Star className="h-4 w-4 mr-2" />
                High Potential
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Venues</CardTitle>
            <CardDescription>Manage your venue partnerships</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-muted-foreground mb-4">No venues added yet</p>
              <Button asChild size="sm">
                <Link href="/profile">Add Venues</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile Status</CardTitle>
            <CardDescription>Your promoter verification</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Verification Status</span>
                <span className="text-sm font-medium text-yellow-600">Pending</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Venues Listed</span>
                <span className="text-sm font-medium">0</span>
              </div>
              <Button asChild size="sm" className="w-full">
                <Link href="/profile">Complete Profile</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Promotion Opportunities</CardTitle>
          <CardDescription>How to maximize your impact</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-purple-600">1</span>
              </div>
              <div>
                <p className="font-medium">Complete Your Profile</p>
                <p className="text-sm text-muted-foreground">Add your venues and promotion experience</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-purple-600">2</span>
              </div>
              <div>
                <p className="font-medium">Browse Events</p>
                <p className="text-sm text-muted-foreground">Find events that match your venue partnerships</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-purple-600">3</span>
              </div>
              <div>
                <p className="font-medium">Connect with KJs</p>
                <p className="text-sm text-muted-foreground">Reach out to event organizers for promotion deals</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}