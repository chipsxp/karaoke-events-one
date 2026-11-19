"use client";

import { Pencil } from "lucide-react";

type EditEventButtonProps = {
  eventId: string;
};

const EditEventButton = ({ eventId }: EditEventButtonProps) => {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    window.location.href = `/events/${eventId}/update`;
  };

  return (
    <button
      onClick={handleEdit}
      aria-label="Edit event"
      className="rounded-lg bg-white/20 p-2 text-white transition-all hover:bg-white/30 hover:scale-110"
    >
      <Pencil className="h-4 w-4" />
    </button>
  );
};

export default EditEventButton;
