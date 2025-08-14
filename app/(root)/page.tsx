import CategoryFilter from "@/components/toptemp/CategoryFilter";
import Collection from "@/components/toptemp/Collection";
import Search from "@/components/toptemp/Search";
import HeroButtons from "@/components/toptemp/HeroButtons";
import CTAButton from "@/components/toptemp/CTAButton";
import { getAllEvents } from "@/lib/actions/event.actions";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, Sparkles, Users, Calendar } from "lucide-react";

export default async function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const page = Number(searchParams?.page) || 1;
  const searchText = (searchParams?.query as string) || "";
  const category = (searchParams?.category as string) || "";

  const events = await getAllEvents({
    query: searchText,
    category,
    page,
    limit: 8,
  });

  return (
    <>
      {/* Hero Section */}
      <section className="wrapper relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 rounded-3xl my-12">
        <div className="absolute inset-0 bg-black/20 rounded-3xl" />

        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" />
          <div
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"
            style={{ animationDelay: "2s" }}
          />
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-red-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"
            style={{ animationDelay: "4s" }}
          />
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center px-5 md:px-10 xl:px-0">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 text-sm text-white mb-6">
              <Sparkles className="h-4 w-4" />
              <span>Join 1000+ karaoke enthusiasts</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
              Host, Connect,
              <span className="text-yellow-300">Celebrate</span>
            </h1>

            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl">
              Create, book and promote your karaoke events. Find the perfect
              venue, connect with fellow singers, and make unforgettable
              memories.
            </p>

            <HeroButtons />

            <div className="flex items-center gap-8 mt-12 justify-center lg:justify-start">
              <div className="flex items-center gap-2 text-white/80">
                <Users className="h-5 w-5" />
                <span className="text-sm">500+ Active Events</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <Calendar className="h-5 w-5" />
                <span className="text-sm">This Week</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative mx-auto w-full max-w-md">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-3xl blur-2xl opacity-30" />
              <Image
                src="/images/hero.jpg"
                alt="Karaoke party"
                width={500}
                height={500}
                className="relative rounded-3xl shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ArrowDown className="h-6 w-6 text-white/60" />
        </div>
      </section>

      {/* Events Section */}
      <section
        id="events"
        className="wrapper my-12 flex flex-col gap-8 rounded-3xl bg-gradient-to-br from-pink-600 via-purple-600 to-yellow-600 py-20 md:py-32"
      >
        <div className="text-center">
          <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">
            Discover Amazing Events
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-white/90">
            Find the perfect karaoke event near you. From intimate gatherings to
            large concerts, there's something for every music lover.
          </p>
        </div>

        <div className="flex w-full flex-col gap-5 md:flex-row">
          <div className="flex-1">
            <Search />
          </div>
          <div className="w-full md:w-64">
            <CategoryFilter />
          </div>
        </div>

        <Collection
          data={events?.data}
          emptyTitle="No Events Found"
          emptyStateSubtext="Try adjusting your search or check back later for new events"
          collectionType="Discover_Events"
          limit={8}
          page={page}
          totalPages={events?.totalPages}
        />
      </section>

      {/* CTA Section */}
      <section className="wrapper bg-gradient-to-r from-purple-600 to-pink-600 py-20 rounded-3xl my-12">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Host Your Own Event?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of hosts creating unforgettable karaoke experiences.
            It's free to get started!
          </p>
          <CTAButton />
        </div>
      </section>
    </>
  );
}
