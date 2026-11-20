import { IEvent } from "@/lib/database/models/event.model";
import { formatDateTime } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";
import { DeleteConfirmation } from "./DeleteConfirmation";
import EditEventButton from "./EditEventButton";
import { Calendar, MapPin, Users, Music, ShieldCheck } from "lucide-react";

type CardProps = {
  event: IEvent;
  hasOrderLink?: boolean;
  hidePrice?: boolean;
};

const Card = async ({ event, hasOrderLink, hidePrice }: CardProps) => {
  // Fail soft (issue #2): if Clerk auth cannot be resolved, render the card
  // without creator controls instead of crashing the whole listing page.
  let userId: string | undefined;
  try {
    const { sessionClaims } = await auth();
    userId = sessionClaims?.userId as string | undefined;
  } catch (error) {
    console.error(
      "[Card] Clerk auth unavailable; hiding creator controls.",
      error
    );
  }

  const isEventCreator =
    Boolean(userId) && userId === event.kj?._id?.toString();

  return (
    <div className="group relative flex min-h-[420px] w-full max-w-[420px] flex-col overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 dark:bg-gray-800">
      {/* Image Section with Overlay */}
      <div className="relative h-56 w-full overflow-hidden">
        <Link href={`/events/${event._id}`} className="block h-full w-full">
          <div className="relative h-full w-full bg-linear-to-br from-purple-400 via-pink-500 to-red-500">
            {event.imageUrl ? (
              <Image
                src={event.imageUrl}
                alt={event.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
                sizes="(max-width: 420px) 100vw, 420px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-purple-400 via-pink-500 to-red-500">
                <Music className="h-16 w-16 text-white/80" />
              </div>
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent"></div>
          </div>
        </Link>

        {/* Price Badge */}
        {!hidePrice && (
          <div className="absolute top-4 left-4">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                event.isFree
                  ? "bg-green-500/90 text-white"
                  : "bg-purple-600/90 text-white"
              } backdrop-blur-sm`}
            >
              {event.isFree ? "FREE" : `$${event.price}`}
            </span>
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center rounded-full bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 text-xs font-medium">
            {event.category.name}
          </span>
        </div>

        {/* Creator Actions (issue #9: always visible on touch/small screens;
            hover/focus reveal on desktop; bottom-right avoids overlapping the
            category badge in the top-right corner) */}
        {isEventCreator && !hidePrice && (
          <div className="absolute bottom-2 right-2 z-10 flex flex-row gap-2 rounded-xl bg-black/40 backdrop-blur-md p-2 shadow-lg opacity-100 transition-all duration-300 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
            <EditEventButton eventId={event._id} />
            <DeleteConfirmation eventId={event._id} />
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col gap-4 p-6">
        {/* Date and Location */}
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-purple-500" />
            <span className="font-medium">
              {
                formatDateTime(
                  typeof event.startDateTime === "string"
                    ? event.startDateTime
                    : event.startDateTime?.toISOString?.()
                ).dateTime
              }
            </span>
          </div>
          {event.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-red-500" />
              <span className="truncate font-medium">{event.location}</span>
            </div>
          )}
        </div>

        {/* Title */}
        <div className="group/title">
          <h3 className="text-xl font-bold text-gray-900 transition-colors group-hover/title:text-purple-600 dark:text-white dark:group-hover/title:text-purple-400 line-clamp-2">
            {event.title}
          </h3>
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {event.description}
          </p>
        )}

        {/* KJ (event host/director) */}
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-linear-to-br from-purple-400 to-pink-500 flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {event.kj?.firstName?.[0]}
                {event.kj?.lastName?.[0]}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
                {event.kj?.firstName} {event.kj?.lastName}
                {event.kj?.kjVerificationStatus === "verified" && (
                  <ShieldCheck
                    className="h-3.5 w-3.5 text-green-600"
                    aria-label="Verified KJ"
                  />
                )}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                KJ · Event Host
              </p>
            </div>
          </div>

          {hasOrderLink && (
            <Link
              href={`/orders?eventId=${event._id}`}
              className="flex items-center gap-1 text-sm font-medium text-purple-600 transition-colors hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
            >
              <Users className="h-4 w-4" />
              <span>Orders</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Card;
