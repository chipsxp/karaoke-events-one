import { IEvent } from "@/lib/database/models/event.model";
import React from "react";
import Card from "./Card";
import Pagination from "./Pagination";

import { CalendarX, Search } from "lucide-react";
import CreateEventButton from "@/components/toptemp/CreateEventButton";
import RegisterForEventsButton from "@/components/toptemp/RegisterForEventsButton";

type CollectionProps = {
  data: IEvent[];
  emptyTitle: string;
  emptyStateSubtext: string;
  limit: number;
  page: number | string;
  totalPages?: number;
  urlParamName?: string;
  collectionType?:
    | "Events_Organized"
    | "My_Tickets"
    | "All_Events"
    | "Discover_Events";
};

const Collection = ({
  data,
  emptyTitle,
  emptyStateSubtext,
  page,
  totalPages = 0,
  collectionType,
  urlParamName,
}: CollectionProps) => {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-center animate-fade-in-up">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            {collectionType === "My_Tickets" ? (
              <CalendarX className="h-10 w-10 text-gray-400" />
            ) : (
              <Search className="h-10 w-10 text-gray-400" />
            )}
          </div>
          <h3 className="text-2xl font-bold text-gray-100 mb-2">
            {emptyTitle}
          </h3>
          <p className="text-gray-100 mb-8 max-w-md">{emptyStateSubtext}</p>
          {collectionType === "All_Events" && <CreateEventButton />}
          {collectionType === "Discover_Events" && <RegisterForEventsButton />}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-10">
      <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-8">
        {data.map((event, index) => {
          const hasOrderLink = collectionType === "Events_Organized";
          const hidePrice = collectionType === "My_Tickets";

          return (
            <div
              key={event._id}
              className="flex justify-center animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Card
                event={event}
                hasOrderLink={hasOrderLink}
                hidePrice={hidePrice}
              />
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <Pagination
            urlParamName={urlParamName}
            page={page}
            totalPages={totalPages}
          />
        </div>
      )}
    </div>
  );
};

export default Collection;
