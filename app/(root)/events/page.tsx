import React from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getUserById } from '@/lib/actions/user.actions';
import { getAllEvents } from '@/lib/actions/event.actions';
import { getOrdersByUser } from '@/lib/actions/order.actions';
import { IOrder } from '@/lib/database/models/order.model';
import Collection from '@/components/toptemp/Collection';
import { SearchParamProps } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Calendar, Music, Star, Users } from 'lucide-react';

const KSEventsPage = async ({ searchParams }: SearchParamProps) => {
  const { userId } = auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  const user = await getUserById(userId);
  
  if (user?.role !== 'KS') {
    redirect('/dashboard');
  }

  const registeredEventsPage = Number(searchParams.registeredPage) || 1;
  const browsePage = Number(searchParams.browsePage) || 1;
  const searchQuery = Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q || '';

  // Get registered/interested events
  const orders = await getOrdersByUser({ userId, page: registeredEventsPage });
  const registeredEvents = orders?.data.map((order: IOrder) => order.event) || [];

  // Get all available events for browsing
  const allEvents = await getAllEvents({
    query: searchQuery,
    limit: 6,
    page: browsePage,
    category: ''
  });

  return (
    <div className="flex flex-col gap-8 lg:mr-36 lg:ml-36 md:m-4 min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      <div className="container gap-8 mx-auto px-12 py-12">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            🎤 My Karaoke Events
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover amazing karaoke events and manage your singing journey
          </p>
        </div>

        {/* Main Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-12">
          {/* Card 1: My Registered Events */}
          <Card className="shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 text-white relative">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-white/20 rounded-full">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-2xl font-bold">My Registered Events</CardTitle>
                </div>
                <CardDescription className="text-purple-100 text-base">
                  Your upcoming karaoke performances and events
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6 bg-white">
              {registeredEvents.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-600">
                      {registeredEvents.length} event{registeredEvents.length !== 1 ? 's' : ''} registered
                    </span>
                    <div className="flex items-center space-x-1 text-yellow-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm font-medium">Active</span>
                    </div>
                  </div>
                  <Collection
                    data={registeredEvents}
                    emptyTitle="No registered events yet"
                    emptyStateSubtext="Start exploring events to register!"
                    collectionType="My_Tickets"
                    limit={3}
                    page={registeredEventsPage}
                    totalPages={orders?.totalPages || 0}
                    urlParamName="registeredPage"
                  />
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-purple-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-10 w-10 text-purple-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Events Yet</h3>
                  <p className="text-gray-500 mb-4">You haven't registered for any events yet.</p>
                  <Button className="bg-purple-500 hover:bg-purple-600 text-white">
                    Browse Events →
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Browse & Discover New Events */}
          <Card className="shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-600 via-blue-500 to-purple-500 text-white relative">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-white/20 rounded-full">
                    <Search className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Discover New Events</CardTitle>
                </div>
                <CardDescription className="text-indigo-100 text-base">
                  Find exciting karaoke events happening near you
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6 bg-white">
              {/* Search Section */}
              <div className="mb-6">
                <form className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      type="text"
                      placeholder="Search events by name, location, or genre..."
                      defaultValue={searchQuery}
                      name="q"
                      className="pl-11 h-12 border-2 border-gray-200 focus:border-indigo-500 rounded-lg"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 h-12 px-6 rounded-lg font-medium"
                  >
                    Search
                  </Button>
                </form>
              </div>
              
              {/* Events Listing */}
              {allEvents?.data && allEvents.data.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-600">
                      {allEvents.data.length} event{allEvents.data.length !== 1 ? 's' : ''} available
                    </span>
                    <div className="flex items-center space-x-1 text-green-500">
                      <Users className="h-4 w-4" />
                      <span className="text-sm font-medium">Join Now</span>
                    </div>
                  </div>
                  <Collection
                    data={allEvents.data}
                    emptyTitle="No events found"
                    emptyStateSubtext="Try adjusting your search criteria"
                    collectionType="All_Events"
                    limit={3}
                    page={browsePage}
                    totalPages={allEvents?.totalPages || 0}
                    urlParamName="browsePage"
                  />
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-indigo-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <Music className="h-10 w-10 text-indigo-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Events Found</h3>
                  <p className="text-gray-500 mb-4">Try searching with different keywords or check back later.</p>
                  <Button className="bg-indigo-500 hover:bg-indigo-600 text-white">
                    Clear Search
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats Dashboard */}
        <div className="flex flex-col md:flex-row justify-center items-stretch gap-6 w-full">
          <div className="flex-1 min-w-0">
            <Card className="bg-gradient-to-br from-green-400 to-emerald-500 text-white border-0 shadow-xl h-full">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-center justify-between flex-1">
                  <div>
                    <p className="text-sm opacity-90 font-medium">Registered Events</p>
                    <p className="text-4xl font-bold mt-1">{registeredEvents.length}</p>
                    <p className="text-xs opacity-75 mt-1">Active registrations</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-full">
                    <Calendar className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex-1 min-w-0">
            <Card className="bg-gradient-to-br from-purple-400 to-pink-500 text-white border-0 shadow-xl h-full">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-center justify-between flex-1">
                  <div>
                    <p className="text-sm opacity-90 font-medium">Available Events</p>
                    <p className="text-4xl font-bold mt-1">{allEvents?.data?.length || 0}</p>
                    <p className="text-xs opacity-75 mt-1">Ready to join</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-full">
                    <Music className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex-1 min-w-0">
            <Card className="bg-gradient-to-br from-green-400 to-teal-500 text-white border-0 shadow-xl h-full">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-center justify-between flex-1">
                  <div>
                    <p className="text-sm opacity-90 font-medium">Upcoming Events</p>
                    <p className="text-4xl font-bold mt-1">{allEvents?.data?.filter((e: any) => new Date(e.date) > new Date()).length || 0}</p>
                    <p className="text-xs opacity-75 mt-1">Events scheduled</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-full">
                    <Calendar className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KSEventsPage;