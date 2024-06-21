"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

// Home Splash Page (landing root) section.
// Place bg-dotted-pattern image in className
export default function Home() {
  return (
    <>
      <section className="bg-primary-50 bg-cover bg-center bg-fixed py-5 md:py10">
        <div className="wrapper grid grid-cols-1 gap-5 md:grid-cols-2 2xl:gap-0">
          <div className="flex flex-col justify-center gap-8">
            <h1 className="text-3xl font-bold">
              Karaoke Events - Register, Promote, Organize
            </h1>
            <p className="p-regular-20 md:p-regular-24">
              Create, Book, Email, and Attend your Karaoke Events
            </p>
            <Button size="lg" asChild className="button w-full sm:w-fit">
              <Link href="#events">Explore Events</Link>
            </Button>
          </div>
          <Image
            src="/images/party-event.jpg"
            alt="Party Events"
            width={640}
            height={470}
            className="max-h[70vh] object-contain object-center 2xl:max-h[50vh]"
          />
        </div>
      </section>
      <section id="events" className="wrapper flex flex-col my-8 gap-8">
        <h2 className="h3-bold">
          Trust By Hundreds of <br />
          Events Managers and Promoters
        </h2>
        <div className="flex w-full flex-col gap-5 md:flex-row">
          <p>Search searchFilter</p>
        </div>
      </section>
    </>
  );
}
3;
