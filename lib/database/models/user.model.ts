import { models, model, Schema } from "mongoose";

// Schema design for users
export const UserSchema = new Schema({
  clerkId: { type: String, required: true, unique: true },
  emailId: { type: String, required: true, unique: true },
  userName: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String },
  photoAvatar: { type: String, required: true, default: "default.png" },
  request: { type: String },
  isHost: { type: Boolean, default: false },
  isPromoter: { type: Boolean, default: false },
});

const User = models.User || model("User", UserSchema);
export default User;
