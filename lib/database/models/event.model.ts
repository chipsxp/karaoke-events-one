import { model, models, Schema } from "mongoose";

// Model design for events base on Schema through interface
export interface IEvent {
  _id: string;
  title: string;
  description: string;
  location: string;
  imageUrl: string;
  createdAt: Date;
  startDateTime: Date;
  endDateTime: Date;
  tickets: number;
  price: number;
  isFree: boolean;
  eventUrl: string;
  category: { _id: string; name: string };
  organizer: { _id: string; promoterId: string };
  host: { _id: string; firstName: string; lastName: string };
}

// note: modify enddatetime with additional 1 day
// Schema design for events
const EventSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  imageUrl: { type: String },
  createdAt: { type: Date, default: Date.now, required: true },
  startDateTime: { type: Date, default: Date.now, required: true },
  endDateTime: { type: Date, default: Date.now, required: true },
  tickets: { type: Number },
  price: { type: Number },
  isFree: { type: Boolean, default: false },
  eventUrl: { type: String },
  category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  organizer: { type: Schema.Types.ObjectId, ref: "Promoter" },
  host: { type: Schema.Types.ObjectId, ref: "Host", required: true },
});

const Event = models.Event || model("Event", EventSchema);
export default Event;
