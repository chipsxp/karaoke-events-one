import EventForm from "@/components/toptemp/EventForm";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserById } from "@/lib/actions/user.actions";

const CreateEvent = async () => {
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const dbUser = await getUserById(userId);

  // If user doesn't exist or role is not KJ, redirect to dashboard
  if (!dbUser || dbUser.role !== "KJ") {
    redirect("/dashboard");
  }

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