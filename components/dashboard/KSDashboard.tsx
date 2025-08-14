"use client"

import { useState, useEffect, useRef } from "react"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Music,
  Calendar,
  Heart,
  Star as StarIcon,
  TrendingUp,
  MapPin,
  Award,
  Sparkles,
  Trophy,
  Zap,
  Target,
  ThumbsUp,
  ChevronLeft,
  ChevronRight,
  Mic,
  CalendarCheck,
  Crown,
  Users,
  Clock
} from "lucide-react"
import Link from "next/link"

// Hide scrollbar but keep functionality
const scrollbarHideStyles = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`

interface KSDashboardProps {
  userId: string
}

interface KSStats {
  totalEventsRegistered: number
  totalEventsAttended: number
  attendanceRate: number
  thumbsUpCount: number // Changed from averageRating
  totalRatings: number
  upcomingEvents: number
  favoriteVenues: number
}

interface RecentEvent {
  _id: string
  title: string
  startDateTime: string
  venue: string
  attended: boolean
  rating?: number
  hostRating?: number
}

const Progress = ({ value, className, color = "purple" }: { value: number; className?: string; color?: string }) => (
  <div className={`w-full bg-gray-100 rounded-full h-3 overflow-hidden ${className}`}>
    <div 
      className={`h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-${color}-400 to-${color}-600`} 
      style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
    ></div>
  </div>
)

const StatCard = ({ 
  icon: Icon, 
  title, 
  value, 
  color, 
  trend 
}: {
  icon: any
  title: string
  value: string | number
  color: string
  trend?: number
}) => (
  <Card className={`bg-gradient-to-br from-${color}-50 to-${color}-100 border-${color}-200 border-2 hover:shadow-lg transition-all duration-300`}>
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <CardTitle className={`text-lg font-bold text-${color}-800`}>{title}</CardTitle>
        <div className={`p-2 rounded-full bg-${color}-200`}>
          <Icon className={`w-5 h-5 text-${color}-600`} />
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-gray-800 mb-1">{value}</div>
      {trend && (
        <div className={`text-sm flex items-center ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
          <TrendingUp className="w-4 h-4 mr-1" />
          {trend > 0 ? '+' : ''}{trend}%
        </div>
      )}
    </CardContent>
  </Card>
)

export default function KSDashboard({ userId }: KSDashboardProps) {
  const { user } = useUser()
  const [stats, setStats] = useState<KSStats>({
    totalEventsRegistered: 12,
    totalEventsAttended: 10,
    attendanceRate: 83.33,
    thumbsUpCount: 47,
    totalRatings: 8,
    upcomingEvents: 3,
    favoriteVenues: 5
  })

  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([
    {
      _id: "1",
      title: "Friday Night Karaoke Party",
      startDateTime: "2024-01-19T20:00:00",
      venue: "The Singing Spot",
      attended: true,
      rating: 5,
      hostRating: 4.8
    },
    {
      _id: "2",
      title: "Weekend Vibes Karaoke",
      startDateTime: "2024-01-20T19:30:00",
      venue: "Melody Lounge",
      attended: false
    },
  ])

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef
      const scrollAmount = current.offsetWidth * 0.8
      current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const getStatusColor = (attended: boolean) => attended ? 'green' : 'yellow'
  const getStatusText = (attended: boolean) => attended ? 'Attended' : 'Upcoming'

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      <div className="container mx-auto px-4 py-4">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            🎤 KS Dashboard
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Welcome back, {user?.firstName || 'Karaoke Star'}! Track your singing journey and discover new events.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            icon={Music} 
            title="Events Registered" 
            value={stats.totalEventsRegistered} 
            color="purple" 
            trend={15}
          />
          <StatCard 
            icon={Trophy} 
            title="Events Attended" 
            value={stats.totalEventsAttended} 
            color="green" 
            trend={8}
          />
          <StatCard 
            icon={Target} 
            title="Attendance Rate" 
            value={`${stats.attendanceRate}%`} 
            color="blue" 
          />
          <StatCard
            icon={ThumbsUp}
            title="Total Thumbs Up"
            value={stats.thumbsUpCount}
            color="pink"
          />
        </div>

        {/* Progress Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
            <CardHeader>
              <CardTitle className="text-indigo-800 flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-700">Attendance Rate</span>
                  <span className="font-semibold text-purple-700">{stats.attendanceRate}%</span>
                </div>
                <Progress value={stats.attendanceRate} color="purple" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-700">Total Thumbs Up</span>
                  <span className="font-semibold text-pink-700">{stats.thumbsUpCount} 👍</span>
                </div>
                <Progress value={Math.min(stats.thumbsUpCount * 2, 100)} color="pink" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-50 to-red-50 border-pink-200">
            <CardHeader>
              <CardTitle className="text-pink-800 flex items-center">
                <Sparkles className="w-5 h-5 mr-2" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="flex overflow-x-auto pb-4 space-x-4 scrollbar-hide" ref={scrollContainerRef}>
                  {/* First Karaoke Badge */}
                  <div className="flex-shrink-0 w-40 bg-white rounded-xl shadow-md p-4 flex flex-col items-center border-2 border-yellow-200">
                    <Award className="w-8 h-8 text-yellow-500 mb-2" />
                    <h3 className="font-bold text-sm text-center text-gray-800">First Karaoke</h3>
                    <p className="text-xs text-gray-500 text-center mt-1">Your debut event</p>
                  </div>

                  {/* Dozen Badge */}
                  <div className="flex-shrink-0 w-40 bg-white rounded-xl shadow-md p-4 flex flex-col items-center border-2 border-blue-200">
                    <Mic className="w-8 h-8 text-blue-500 mb-2" />
                    <h3 className="font-bold text-sm text-center text-gray-800">12+ Events</h3>
                    <p className="text-xs text-gray-500 text-center mt-1">Karaoke veteran</p>
                  </div>

                  {/* Frequent Performer Badge */}
                  <div className="flex-shrink-0 w-40 bg-white rounded-xl shadow-md p-4 flex flex-col items-center border-2 border-purple-200">
                    <CalendarCheck className="w-8 h-8 text-purple-500 mb-2" />
                    <h3 className="font-bold text-sm text-center text-gray-800">Frequent Singer</h3>
                    <p className="text-xs text-gray-500 text-center mt-1">Regular participant</p>
                  </div>

                  {/* Thumbs Up Badge */}
                  <div className="flex-shrink-0 w-40 bg-white rounded-xl shadow-md p-4 flex flex-col items-center border-2 border-pink-200">
                    <ThumbsUp className="w-8 h-8 text-pink-500 mb-2" />
                    <h3 className="font-bold text-sm text-center text-gray-800">Thumbs Star</h3>
                    <p className="text-xs text-gray-500 text-center mt-1">{stats.thumbsUpCount}+ thumbs</p>
                  </div>

                  {/* Attendance Badge */}
                  <div className="flex-shrink-0 w-40 bg-white rounded-xl shadow-md p-4 flex flex-col items-center border-2 border-green-200">
                    <Trophy className="w-8 h-8 text-green-500 mb-2" />
                    <h3 className="font-bold text-sm text-center text-gray-800">Perfect Shows</h3>
                    <p className="text-xs text-gray-500 text-center mt-1">{stats.attendanceRate}% rate</p>
                  </div>

                  {/* Crown Badge */}
                  <div className="flex-shrink-0 w-40 bg-white rounded-xl shadow-md p-4 flex flex-col items-center border-2 border-orange-200">
                    <Crown className="w-8 h-8 text-orange-500 mb-2" />
                    <h3 className="font-bold text-sm text-center text-gray-800">Karaoke King/Queen</h3>
                    <p className="text-xs text-gray-500 text-center mt-1">Top performer</p>
                  </div>

                  {/* Social Butterfly Badge */}
                  <div className="flex-shrink-0 w-40 bg-white rounded-xl shadow-md p-4 flex flex-col items-center border-2 border-indigo-200">
                    <Users className="w-8 h-8 text-indigo-500 mb-2" />
                    <h3 className="font-bold text-sm text-center text-gray-800">Social Star</h3>
                    <p className="text-xs text-gray-500 text-center mt-1">Most venues visited</p>
                  </div>

                  {/* Night Owl Badge */}
                  <div className="flex-shrink-0 w-40 bg-white rounded-xl shadow-md p-4 flex flex-col items-center border-2 border-teal-200">
                    <Clock className="w-8 h-8 text-teal-500 mb-2" />
                    <h3 className="font-bold text-sm text-center text-gray-800">Night Owl</h3>
                    <p className="text-xs text-gray-500 text-center mt-1">Late night events</p>
                  </div>
                </div>

                {/* Navigation Arrows */}
                <button
                  onClick={() => scroll('left')}
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 bg-white rounded-full p-2 shadow-md hover:bg-gray-50 border border-gray-200 z-10"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => scroll('right')}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-2 bg-white rounded-full p-2 shadow-md hover:bg-gray-50 border border-gray-200 z-10"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      {/* Add scrollbar hide styles to the scrollable container */}
      <style jsx>{`
        ::-webkit-scrollbar {
          display: none;
        }
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
      `}</style>

        {/* Recent Events Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Recent Events
            </h2>
            <Link href="/events">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                Browse All Events
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentEvents.map((event) => (
              <Card key={event._id} className="bg-white border-2 hover:shadow-xl transition-all duration-300 hover:border-purple-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-gray-800 line-clamp-1">
                      {event.title}
                    </CardTitle>
                    <Badge 
                      variant={event.attended ? "default" : "secondary"}
                      className={`${event.attended ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                    >
                      {getStatusText(event.attended)}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm text-gray-600">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {new Date(event.startDateTime).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 text-purple-500" />
                      {event.venue}
                    </div>
                    {event.attended && event.rating && (
                      <div className="flex items-center">
                        <StarIcon className="w-4 h-4 text-yellow-500 mr-1" />
                        <span className="text-sm font-semibold">{event.rating}/5.0</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <Button 
                      variant={event.attended ? "outline" : "default"}
                      className={`w-full ${event.attended ? 'border-purple-500 text-purple-600 hover:bg-purple-50' : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'}`}
                      size="sm"
                    >
                      {event.attended ? 'View Details' : 'Register Now'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Changed from Link wrapping Card to Card with onClick to avoid nested anchor tags */}
          <Card
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 transition-all duration-300 cursor-pointer"
            onClick={() => window.location.href = "/events"}
          >
            <CardContent className="p-6 text-center">
              <Music className="w-8 h-8 mx-auto mb-2" />
              <h3 className="font-bold">Find Events</h3>
              <p className="text-sm opacity-90">Discover new karaoke nights</p>
            </CardContent>
          </Card>

          <Card
            className="bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:from-pink-600 hover:to-pink-700 transition-all duration-300 cursor-pointer"
            onClick={() => window.location.href = "/profile"}
          >
            <CardContent className="p-6 text-center">
              <Heart className="w-8 h-8 mx-auto mb-2" />
              <h3 className="font-bold">My Profile</h3>
              <p className="text-sm opacity-90">Manage your preferences</p>
            </CardContent>
          </Card>

          <Card
            className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700 transition-all duration-300 cursor-pointer"
            onClick={() => window.location.href = "/orders"}
          >
            <CardContent className="p-6 text-center">
              <Award className="w-8 h-8 mx-auto mb-2" />
              <h3 className="font-bold">My Tickets</h3>
              <p className="text-sm opacity-90">View your event tickets</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}