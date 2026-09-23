import EventForm from "@/components/toptemp/EventForm";
// PREVIEW MODE (ui-work branch, revert before merging to main): auth()/role redirect removed, no ClerkProvider available.

const CreateEvent = async () => {
  const userId = "preview-user"; // PREVIEW MODE stub, was: const { userId } = await auth(); + redirects

  return (
    <>
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <h3 className="wrapper h3-bold text-center sm:text-left">
          Create Event
        </h3>
      </section>

      <div className="wrapper my-8">
        <EventForm userId={userId} type="Create" />
      </div>
    </>
  );
};

export default CreateEvent;