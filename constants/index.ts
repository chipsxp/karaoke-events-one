// navigation links map for Unordered List in NavItems
export const headerLinks = [
  {
    label: "Home",
    route: "/",
  },
  {
    label: "Create Event",
    route: "/events/create",
  },
  {
    label: "My Profile",
    route: "/profile",
  },
];
// Template model for Events Card Display
export const eventDefaultValues = {
  title: "",
  description: "",
  location: "",
  imageUrl: "",
  startDateTime: new Date(),
  endDateTime: new Date(),
  categoryId: "",
  price: "",
  isFree: false,
  url: "",
  tickets: 0,
  organizerId: "",
  hostId: "",
  capacity: 50,
  autoApprove: false,
};
