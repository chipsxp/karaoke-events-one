import { SignUp } from "@clerk/nextjs";

export default function RegisterUser() {
  return (
    <div className="flex-center bg-green-400 border-dashed">
      <SignUp />
    </div>
  );
}
