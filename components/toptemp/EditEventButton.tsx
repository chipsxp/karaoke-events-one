"use client";

import Image from "next/image";

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
      className="rounded-lg bg-white/20 p-2 text-white transition-all hover:bg-white/30 hover:scale-110"
    >
      <Image
        src="/assets/icons/edit.svg"
        alt="edit"
        width={16}
        height={16}
        className="h-4 w-4"
      />
    </button>
  );
};

export default EditEventButton;
