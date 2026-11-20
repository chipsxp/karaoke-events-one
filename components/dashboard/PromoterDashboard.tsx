"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Building2, CheckCircle2, XCircle, RefreshCw,
  PlusCircle, MapPin, AlertTriangle, ShieldCheck, Trash2, Calendar, Mic,
} from "lucide-react"
import {
  approveKJVerification,
  rejectKJVerification,
  getPendingKJVerifications,
} from "@/lib/actions/user.actions"
import {
  createVenue,
  getVenuesByPromoter,
  deactivateVenue,
} from "@/lib/actions/venue.actions"
import { getPromoterDashboardData } from "@/lib/actions/dashboard.actions"

interface PromoterDashboardProps {
  userId: string // Clerk id
}

interface PendingKJ {
  clerkId: string
  firstName: string
  lastName?: string
  emailId?: string
  experience?: string
  equipment?: string[]
  genres?: string[]
  createdAt?: string
}

interface PromoterVenue {
  _id: string
  name: string
  address: string
  city?: string
  state?: string
  zipCode?: string
  capacity?: number
  description?: string
  isActive: boolean
}

const emptyVenueForm = {
  name: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  capacity: "",
  description: "",
}

export default function PromoterDashboard({ userId }: PromoterDashboardProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalVenues: 0,
    pendingKJs: 0,
    upcomingEventsAtVenues: 0,
    totalEventsAtVenues: 0,
  })
  const [venues, setVenues] = useState<PromoterVenue[]>([])
  const [pendingKJs, setPendingKJs] = useState<PendingKJ[]>([])
  const [showVenueForm, setShowVenueForm] = useState(false)
  const [venueForm, setVenueForm] = useState(emptyVenueForm)
  const [savingVenue, setSavingVenue] = useState(false)

  const loadAll = useCallback(async () => {
    try {
      setError(null)
      const [data, venueData, kjData] = await Promise.all([
        getPromoterDashboardData(userId),
        getVenuesByPromoter(userId),
        getPendingKJVerifications(),
      ])
      if (data) setStats(data)
      setVenues(Array.isArray(venueData) ? venueData : [])
      setPendingKJs(Array.isArray(kjData) ? kjData : [])
    } catch (e: any) {
      setError(e?.message || "Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const handleApproveKJ = async (kjClerkId: string) => {
    setBusyId(kjClerkId)
    setError(null)
    try {
      await approveKJVerification(kjClerkId, userId)
      await loadAll()
    } catch (e: any) {
      setError(e?.message || "Failed to approve KJ")
    } finally {
      setBusyId(null)
    }
  }

  const handleRejectKJ = async (kjClerkId: string) => {
    const notes = window.prompt("Reason for rejecting this KJ? (optional)")
    if (notes === null) return
    setBusyId(kjClerkId)
    setError(null)
    try {
      await rejectKJVerification(kjClerkId, userId, notes || undefined)
      await loadAll()
    } catch (e: any) {
      setError(e?.message || "Failed to reject KJ")
    } finally {
      setBusyId(null)
    }
  }

  const handleCreateVenue = async () => {
    if (!venueForm.name.trim() || !venueForm.address.trim()) {
      setError("Venue name and address are required.")
      return
    }
    setSavingVenue(true)
    setError(null)
    try {
      await createVenue({
        promoterId: userId,
        venue: {
          name: venueForm.name.trim(),
          address: venueForm.address.trim(),
          city: venueForm.city.trim() || undefined,
          state: venueForm.state.trim() || undefined,
          zipCode: venueForm.zipCode.trim() || undefined,
          description: venueForm.description.trim() || undefined,
          capacity: venueForm.capacity ? Number(venueForm.capacity) : undefined,
        },
        path: "/dashboard",
      })
      setVenueForm(emptyVenueForm)
      setShowVenueForm(false)
      await loadAll()
    } catch (e: any) {
      setError(e?.message || "Failed to create venue")
    } finally {
      setSavingVenue(false)
    }
  }

  const handleDeactivateVenue = async (venueId: string) => {
    if (!window.confirm("Deactivate this venue? Scheduled events keep their location.")) return
    setBusyId(venueId)
    setError(null)
    try {
      await deactivateVenue(venueId, userId)
      await loadAll()
    } catch (e: any) {
      setError(e?.message || "Failed to deactivate venue")
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="h-10 w-72 animate-pulse rounded bg-gray-200" />
        <div className="grid gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      </div>
    )
  }

  const setField = (key: keyof typeof emptyVenueForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setVenueForm((f) => ({ ...f, [key]: e.target.value }))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Building2 className="h-7 w-7 text-purple-600" /> Promoter Dashboard
          </h1>
          <p className="text-muted-foreground">
            You are the location — manage your venues and approve the KJs who host events.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Verified Promoter
          </Badge>
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

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Your Venues</CardDescription>
            <CardTitle className="text-4xl">{stats.totalVenues}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>KJs Awaiting Approval</CardDescription>
            <CardTitle className="text-4xl text-yellow-600">{stats.pendingKJs}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Upcoming at Your Venues</CardDescription>
            <CardTitle className="text-4xl text-purple-600">{stats.upcomingEventsAtVenues}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Events Hosted</CardDescription>
            <CardTitle className="text-4xl">{stats.totalEventsAtVenues}</CardTitle>
          </CardHeader>
        </Card>
      </div>


      {/* KJ approval queue — top of the chain of command */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-purple-600" /> KJ Approvals
          </CardTitle>
          <CardDescription>
            Karaoke Jockeys requesting to host events. As a Promoter (venue owner), you approve KJs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingKJs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No KJs waiting for approval right now.
            </p>
          ) : (
            <ul className="space-y-3">
              {pendingKJs.map((kj) => (
                <li key={kj.clerkId} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {kj.firstName} {kj.lastName}
                      </p>
                      {kj.emailId && (
                        <p className="text-xs text-muted-foreground">{kj.emailId}</p>
                      )}
                      {kj.experience && (
                        <p className="mt-2 text-sm text-muted-foreground">{kj.experience}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        {(kj.equipment || []).slice(0, 5).map((item) => (
                          <Badge key={item} variant="outline">{item}</Badge>
                        ))}
                        {(kj.genres || []).slice(0, 5).map((g) => (
                          <Badge key={g} variant="secondary">{g}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button size="sm" onClick={() => handleApproveKJ(kj.clerkId)} disabled={busyId === kj.clerkId}>
                        <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleRejectKJ(kj.clerkId)} disabled={busyId === kj.clerkId}>
                        <XCircle className="mr-1 h-4 w-4" /> Reject
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Venues */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-purple-600" /> Your Venues
              </CardTitle>
              <CardDescription>
                Locations where KJs can host events. KJs pick one of these when creating an event.
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowVenueForm((v) => !v)}>
              <PlusCircle className="mr-1 h-4 w-4" />
              {showVenueForm ? "Close" : "Add Venue"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showVenueForm && (
            <div className="grid gap-3 rounded-lg border bg-gray-50 p-4 md:grid-cols-2">
              <Input placeholder="Venue name *" value={venueForm.name} onChange={setField("name")} />
              <Input placeholder="Street address *" value={venueForm.address} onChange={setField("address")} />
              <Input placeholder="City" value={venueForm.city} onChange={setField("city")} />
              <Input placeholder="State" value={venueForm.state} onChange={setField("state")} />
              <Input placeholder="ZIP code" value={venueForm.zipCode} onChange={setField("zipCode")} />
              <Input
                type="number"
                min={1}
                placeholder="Capacity"
                value={venueForm.capacity}
                onChange={setField("capacity")}
              />
              <Input
                placeholder="Description (parking, stage, private rooms...)"
                className="md:col-span-2"
                value={venueForm.description}
                onChange={setField("description")}
              />
              <div className="md:col-span-2">
                <Button onClick={handleCreateVenue} disabled={savingVenue}>
                  {savingVenue ? "Saving..." : "Save Venue"}
                </Button>
              </div>
            </div>
          )}

          {venues.length === 0 ? (
            <div className="py-6 text-center">
              <Building2 className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm text-muted-foreground">
                No venues yet. Add the location(s) you own or run so KJs can host events there.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {venues.map((venue) => (
                <li key={venue._id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-medium">
                      {venue.name}
                      {!venue.isActive && <Badge variant="secondary">Inactive</Badge>}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {[venue.address, venue.city, venue.state, venue.zipCode].filter(Boolean).join(", ")}
                      {venue.capacity ? ` · capacity ${venue.capacity}` : ""}
                    </p>
                    {venue.description && (
                      <p className="mt-1 text-xs text-muted-foreground">{venue.description}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      <Calendar className="h-3 w-3" /> Venue
                    </Badge>
                    {venue.isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeactivateVenue(venue._id)}
                        disabled={busyId === venue._id}
                        aria-label={`Deactivate ${venue.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

