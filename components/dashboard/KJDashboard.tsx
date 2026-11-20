"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Mic, Calendar, Users, Clock, CheckCircle2, XCircle,
  PlusCircle, RefreshCw, ShieldCheck, AlertTriangle, UserCheck,
} from "lucide-react"
import {
  getKJVerificationStatus,
  submitKJVerification,
} from "@/lib/actions/user.actions"
import {
  getKJDashboardData,
  getKJRegistrationQueue,
} from "@/lib/actions/dashboard.actions"
import { getEventsWithRegistrations } from "@/lib/actions/event.actions"
import {
  approveRegistration,
  rejectRegistration,
  markAttendance,
} from "@/lib/actions/eventRegistration.actions"

interface KJDashboardProps {
  userId: string // Clerk id
}

interface KJStats {
  totalEvents: number
  pendingRegistrations: number
  upcomingEvents: number
}

interface QueueItem {
  _id: string
  songRequests: string[]
  groupSize: number
  createdAt: string
  userId?: { firstName: string; lastName: string; emailId?: string; vocalRange?: string }
  eventId?: { title: string; startDateTime: string }
}

interface KJEvent {
  _id: string
  title: string
  startDateTime: string
  status: string
  venue?: { name: string; address: string } | null
  stats?: { totalPending: number; totalApproved: number; totalInterested: number; totalRegistered: number }
}

export default function KJDashboard({ userId }: KJDashboardProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [verification, setVerification] = useState<{
    verificationStatus: string
    experience?: string
    equipment?: string[]
    genres?: string[]
  } | null>(null)
  const [stats, setStats] = useState<KJStats>({ totalEvents: 0, pendingRegistrations: 0, upcomingEvents: 0 })
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [events, setEvents] = useState<KJEvent[]>([])

  // Verification request form
  const [experience, setExperience] = useState("")
  const [equipment, setEquipment] = useState("")
  const [genres, setGenres] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const loadVerifiedData = useCallback(async () => {
    const [data, queueData, eventsData] = await Promise.all([
      getKJDashboardData(userId),
      getKJRegistrationQueue(userId),
      getEventsWithRegistrations(userId),
    ])
    if (data) {
      setStats({
        totalEvents: data.totalEvents ?? 0,
        pendingRegistrations: data.pendingRegistrations ?? 0,
        upcomingEvents: data.upcomingEvents ?? 0,
      })
    }
    setQueue(Array.isArray(queueData) ? queueData : [])
    setEvents(Array.isArray(eventsData) ? eventsData : [])
  }, [userId])

  const loadAll = useCallback(async () => {
    try {
      setError(null)
      const v = await getKJVerificationStatus(userId)
      setVerification(v ?? null)
      if (v) {
        setExperience(v.experience || "")
        setEquipment((v.equipment || []).join(", "))
        setGenres((v.genres || []).join(", "))
      }
      if (v?.verificationStatus === "verified") {
        await loadVerifiedData()
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }, [userId, loadVerifiedData])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const handleSubmitVerification = async () => {
    if (!experience.trim()) {
      setError("Please describe your KJ experience before requesting verification.")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await submitKJVerification(userId, {
        experience: experience.trim(),
        equipment: equipment.split(",").map((s) => s.trim()).filter(Boolean),
        genres: genres.split(",").map((s) => s.trim()).filter(Boolean),
      })
      await loadAll()
    } catch (e: any) {
      setError(e?.message || "Failed to submit verification request")
    } finally {
      setSubmitting(false)
    }
  }

  const handleApprove = async (registrationId: string) => {
    setBusyId(registrationId)
    setError(null)
    try {
      await approveRegistration({ registrationId, approvedBy: userId })
      await loadVerifiedData()
    } catch (e: any) {
      setError(e?.message || "Failed to approve singer")
    } finally {
      setBusyId(null)
    }
  }

  const handleReject = async (registrationId: string) => {
    const notes = window.prompt("Reason for rejecting this singer? (optional)")
    if (notes === null) return // cancelled
    setBusyId(registrationId)
    setError(null)
    try {
      await rejectRegistration({ registrationId, approvedBy: userId, notes: notes || undefined })
      await loadVerifiedData()
    } catch (e: any) {
      setError(e?.message || "Failed to reject registration")
    } finally {
      setBusyId(null)
    }
  }

  const handleAttended = async (registrationId: string) => {
    setBusyId(registrationId)
    setError(null)
    try {
      await markAttendance(registrationId, userId)
      await loadVerifiedData()
    } catch (e: any) {
      setError(e?.message || "Failed to mark attendance")
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="h-10 w-64 animate-pulse rounded bg-gray-200" />
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      </div>
    )
  }

  const status = verification?.verificationStatus || "pending"
  const isVerified = status === "verified"

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Mic className="h-7 w-7 text-purple-600" /> KJ Dashboard
          </h1>
          <p className="text-muted-foreground">
            You are the event host/director — run your karaoke nights and approve singers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isVerified && (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
              <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Verified KJ
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={() => { setLoading(true); loadAll() }}>
            <RefreshCw className="mr-1 h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* ===== Not yet verified: Promoter approval flow ===== */}
      {!isVerified && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-purple-600" /> KJ Verification
              </CardTitle>
              <CardDescription>
                KJs are approved by Promoters (venue owners). Submit your experience so a
                Promoter can review and approve you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {status === "pending" && verification?.experience ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                    <Clock className="h-4 w-4" />
                    Waiting for Promoter approval. You can create events once approved.
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Submitted experience:</span>{" "}
                    {verification.experience}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {status === "rejected" && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                      <XCircle className="h-4 w-4" />
                      Your last verification request was rejected. Update your details and try again.
                    </div>
                  )}
                  <div>
                    <label className="mb-1 block text-sm font-medium">Experience *</label>
                    <Textarea
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="How long have you been running karaoke nights? What kind of events?"
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Equipment (comma separated)</label>
                    <Input
                      value={equipment}
                      onChange={(e) => setEquipment(e.target.value)}
                      placeholder="Mixer, Microphones, Songbook table, Speakers"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Genres (comma separated)</label>
                    <Input
                      value={genres}
                      onChange={(e) => setGenres(e.target.value)}
                      placeholder="Pop, Rock, Country, R&B"
                    />
                  </div>
                  <Button onClick={handleSubmitVerification} disabled={submitting} className="w-full">
                    {submitting ? "Submitting..." : "Request Promoter Verification"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How the chain of command works</CardTitle>
              <CardDescription>Your place in the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">1. Promoter</span> — the venue owner/location host. Approves KJs.</p>
              <p><span className="font-medium text-foreground">2. KJ (you)</span> — the event host/director. Once approved, create events and approve singers.</p>
              <p><span className="font-medium text-foreground">3. KS</span> — singers. They get a ticket and you accept them into your event.</p>
            </CardContent>
          </Card>
        </div>
      )}


      {/* ===== Verified KJ: stats, approval queue, events ===== */}
      {isVerified && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Events</CardDescription>
                <CardTitle className="text-4xl">{stats.totalEvents}</CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild size="sm" variant="outline">
                  <Link href="/events/create">
                    <PlusCircle className="mr-1 h-4 w-4" /> Create Event
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Singers Awaiting Approval</CardDescription>
                <CardTitle className="text-4xl text-yellow-600">{stats.pendingRegistrations}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Review ticket holders below
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Upcoming Events</CardDescription>
                <CardTitle className="text-4xl text-purple-600">{stats.upcomingEvents}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Published events starting from now
              </CardContent>
            </Card>
          </div>

          {/* Singer approval queue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-purple-600" /> Singer Approval Queue
              </CardTitle>
              <CardDescription>
                Singers (KS) who got a ticket for your events. You approve who joins.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {queue.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No singers waiting. New ticket holders will appear here for approval.
                </p>
              ) : (
                <ul className="space-y-3">
                  {queue.map((item) => (
                    <li
                      key={item._id}
                      className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">
                          {item.userId?.firstName} {item.userId?.lastName}
                          {item.groupSize > 1 && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              +{item.groupSize - 1} guests
                            </span>
                          )}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {item.eventId?.title} ·{" "}
                          {item.eventId?.startDateTime
                            ? new Date(item.eventId.startDateTime).toLocaleString()
                            : ""}
                        </p>
                        {item.songRequests?.length > 0 && (
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            🎤 {item.songRequests.join(", ")}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(item._id)}
                          disabled={busyId === item._id}
                        >
                          <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(item._id)}
                          disabled={busyId === item._id}
                        >
                          <XCircle className="mr-1 h-4 w-4" /> Reject
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Your events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" /> Your Events
              </CardTitle>
              <CardDescription>Events you host, with registration stats</CardDescription>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <div className="py-6 text-center">
                  <Mic className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                  <p className="mb-4 text-sm text-muted-foreground">No events yet.</p>
                  <Button asChild size="sm">
                    <Link href="/events/create">Create Your First Event</Link>
                  </Button>
                </div>
              ) : (
                <ul className="space-y-3">
                  {events.map((ev) => (
                    <li key={ev._id} className="rounded-lg border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link href={`/events/${ev._id}`} className="font-medium hover:underline">
                          {ev.title}
                        </Link>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{ev.status}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(ev.startDateTime).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {ev.venue?.name && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {ev.venue.name} — {ev.venue.address}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" /> {ev.stats?.totalPending ?? 0} pending
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" /> {ev.stats?.totalApproved ?? 0} approved
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <Users className="h-3 w-3" /> {ev.stats?.totalInterested ?? 0} interested
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

