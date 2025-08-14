import Collection from "@/components/toptemp/Collection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getEventsByUser } from "@/lib/actions/event.actions";
import { getOrdersByUser } from "@/lib/actions/order.actions";
import { getAllEvents } from "@/lib/actions/event.actions";
import { getUserById } from "@/lib/actions/user.actions";
import { IOrder } from "@/lib/database/models/order.model";
import { SearchParamProps } from "@/types";
import { auth } from "@clerk/nextjs/server";
import {
  MapPin,
  Music,
  Users,
  Mic,
  Heart,
  Star,
  Ticket,
  Search as SearchIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import React from "react";
import WelcomeBannerButton from "@/components/toptemp/WelcomeBannerButton";
import ProfileButtons from "@/components/toptemp/ProfileButtons";

const ProfilePage = async ({ searchParams }: SearchParamProps) => {
  const { userId } = auth();

  if (!userId) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
        <p className="text-muted-foreground">
          You need to be signed in to view your profile.
        </p>
      </div>
    );
  }

  const ordersPage = Number(searchParams?.ordersPage) || 1;
  const eventsPage = Number(searchParams?.eventsPage) || 1;

  try {
    // Fetch user data
    const user = await getUserById(userId);

    // Fetch all events to calculate stats
    const allEvents = await getAllEvents({
      query: "",
      limit: 1000, // High limit to get all events
      page: 1,
      category: "",
    });

    // Calculate stats
    const uniqueVenues = new Set(
      allEvents?.data?.map((e: any) => e.location) || []
    ).size;
    const totalGenres = new Set(
      allEvents?.data?.map((e: any) => e.category.name) || []
    ).size;
    const totalArtists = new Set(
      allEvents?.data?.map((e: any) => e.artistId) || []
    ).size;

    const orders = await getOrdersByUser({ userId, page: ordersPage });
    const orderedEvents =
      orders?.data.map((order: IOrder) => order.event) || [];
    let organizedEvents = null;
    if (user?.role === "KJ") {
      organizedEvents = await getEventsByUser({ userId, page: eventsPage });
    }

    return (
      <>
        {/* Welcome Banner */}
        <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-6">
          <div className="wrapper">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
                <div className="ml-4">
                  <h1 className="text-2xl md:text-3xl font-bold">
                    Welcome back, {user?.firstName || "Karaoke Star"}!
                  </h1>
                  <p className="text-purple-200">
                    Ready to sing your heart out?
                  </p>
                </div>
              </div>
              <WelcomeBannerButton />
            </div>
          </div>
        </section>

        {/* Profile Header */}
        <section className="bg-white py-8 border-b">
          <div className="wrapper">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center mb-6 md:mb-0">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-24 h-24 md:w-32 md:h-32" />
                <div className="ml-6">
                  <h1 className="text-3xl md:text-4xl font-bold">
                    {user?.firstName} {user?.lastName}
                  </h1>
                  <p className="text-purple-600 mt-2 font-medium">
                    {user?.role === "KJ" && "Karaoke Jockey"}
                    {user?.role === "KS" && "Karaoke Singer"}
                    {user?.role === "Promoter" && "Event Promoter"}
                  </p>
                  <div className="flex flex-wrap items-center mt-3 gap-2">
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                      {orderedEvents.length} Events Attended
                    </span>
                    {user?.role === "KJ" && (
                      <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm">
                        {organizedEvents?.data?.length || 0} Events Organized
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <ProfileButtons
                type="edit-profile"
                variant="outline"
                className="border-purple-600 text-purple-600 hover:bg-purple-50 font-semibold px-6 py-3 rounded-full flex items-center"
              />
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50 py-12">
          <div className="wrapper">
            <h2 className="text-3xl font-bold text-center mb-2">
              Karaoke Universe
            </h2>
            <p className="text-center text-gray-600 mb-8">
              Explore the world of karaoke with these stats
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Unique Venues Card */}
              <Card className="bg-gradient-to-br from-orange-400 to-red-500 text-white border-0 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90 font-medium">
                        Unique Venues
                      </p>
                      <p className="text-4xl font-bold mt-1">{uniqueVenues}</p>
                      <p className="text-xs opacity-75 mt-1">
                        Different locations
                      </p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-full">
                      <MapPin className="h-8 w-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Genres Card */}
              <Card className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white border-0 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90 font-medium">
                        Total Genres
                      </p>
                      <p className="text-4xl font-bold mt-1">{totalGenres}</p>
                      <p className="text-xs opacity-75 mt-1">
                        Music categories
                      </p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-full">
                      <Music className="h-8 w-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Artists Card */}
              <Card className="bg-gradient-to-br from-purple-400 to-indigo-500 text-white border-0 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90 font-medium">
                        Total Artists
                      </p>
                      <p className="text-4xl font-bold mt-1">{totalArtists}</p>
                      <p className="text-xs opacity-75 mt-1">
                        Performers count
                      </p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-full">
                      <Users className="h-8 w-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Preferences Section */}
        <section className="py-12 bg-white">
          <div className="wrapper">
            <h2 className="text-3xl font-bold text-center mb-2">
              Your Preferences
            </h2>
            <p className="text-center text-gray-600 mb-8">
              Customize your karaoke experience
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <Card className="border rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start">
                    <Heart className="h-6 w-6 text-pink-500 mt-1 mr-4" />
                    <div>
                      <h3 className="text-xl font-semibold mb-2">
                        Favorite Genres
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                          Pop
                        </span>
                        <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm">
                          Rock
                        </span>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                          Jazz
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start">
                    <MapPin className="h-6 w-6 text-orange-500 mt-1 mr-4" />
                    <div>
                      <h3 className="text-xl font-semibold mb-2">
                        Preferred Venues
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                          Downtown
                        </span>
                        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                          Midtown
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* My Tickets Section - Only for KS users */}
        {user?.role === "KS" && (
          <section className="bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50 py-10">
            <div className="wrapper">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold flex items-center justify-center">
                  <Ticket className="mr-2 h-8 w-8 text-purple-600" />
                  My Tickets
                </h3>
                <p className="text-gray-600 mt-2">
                  All the events you've registered for
                </p>
              </div>

              {/* Search and Filter Bar */}
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8 max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      placeholder="Search your tickets..."
                      className="pl-10 w-full py-6 text-base"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="free-tickets" className="h-5 w-5" />
                    <label
                      htmlFor="free-tickets"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Free tickets only
                    </label>
                  </div>
                  <ProfileButtons
                    type="explore-events"
                    className="w-full md:w-auto bg-purple-600 hover:bg-purple-700"
                  />
                </div>
              </div>

              {/* Tickets Grid */}
              {orderedEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                  {orderedEvents.map((event: any) => (
                    <Card
                      key={event._id}
                      className="overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 rounded-xl border-0 shadow-lg"
                    >
                      <div className="relative">
                        <div className="bg-gradient-to-r from-purple-400 to-pink-500 h-48 flex items-center justify-center">
                          <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                            <Music className="h-12 w-12 text-white" />
                          </div>
                        </div>
                        <div className="absolute top-4 right-4 bg-white text-purple-600 px-3 py-1 rounded-full text-sm font-bold shadow-md">
                          {event.price > 0 ? `$${event.price}` : "FREE"}
                        </div>
                      </div>
                      <CardContent className="p-5">
                        <h4 className="font-bold text-xl mb-2 text-gray-800">
                          {event.title}
                        </h4>
                        <div className="space-y-2 text-gray-600">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-purple-500" />
                            <ProfileButtons
                              type="view-details"
                              eventId={event._id}
                              size="sm"
                              variant="outline"
                              className="border-purple-200 text-purple-600 hover:bg-purple-50"
                            />
                            <span className="text-sm">{event.location}</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2 text-purple-500" />
                            <span className="text-sm">
                              {event.artistId?.firstName}{" "}
                              {event.artistId?.lastName}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 mr-2 text-purple-500" />
                            <span className="text-sm">
                              {event.startDateTime
                                ? new Date(
                                    event.startDateTime
                                  ).toLocaleDateString()
                                : "Date TBD"}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                          <ProfileButtons
                            type="view-details"
                            eventId={event._id}
                            size="sm"
                            variant="outline"
                            className="border-purple-200 text-purple-600 hover:bg-purple-50"
                          />
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                          >
                            <Ticket className="mr-1 h-4 w-4" />
                            Ticket
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 max-w-md mx-auto">
                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-full p-6 w-32 h-32 flex items-center justify-center mx-auto mb-6">
                    <Ticket className="h-16 w-16 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    No tickets yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    You haven't purchased any tickets. Start exploring events!
                  </p>
                  <ProfileButtons
                    type="no-tickets-browse"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-3"
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {/* Events Organized Section - Only for KJ users */}
        {user?.role === "KJ" && (
          <>
            <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
              <div className="wrapper flex items-center justify-center sm:justify-between">
                <h3 className="h3-bold text-center sm:text-left">
                  Events Organized
                </h3>
                <ProfileButtons
                  type="create-event"
                  size="lg"
                  className="button hidden sm:flex"
                />
              </div>
            </section>

            <section className="wrapper my-8">
              <Collection
                data={organizedEvents?.data}
                emptyTitle="No events have been created yet"
                emptyStateSubtext="Go create some events now!"
                collectionType="Events_Organized"
                limit={3}
                page={eventsPage}
                urlParamName="eventsPage"
                totalPages={organizedEvents?.totalPages}
              />
            </section>
          </>
        )}
      </>
    );
  } catch (error) {
    console.error("Error loading profile:", error);
    return (
      <>
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold mb-4">Error Loading Profile</h1>
          <p className="text-muted-foreground">
            There was an error loading your profile. Please try again.
          </p>
        </div>
      </>
    );
  }
};

export default ProfilePage;
