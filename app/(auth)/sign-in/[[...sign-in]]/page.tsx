import { SignIn } from "@clerk/nextjs";

export default function LoginUser() {
  return (
    <div className="flex-center bg-yellow-400 border-dashed">
      <SignIn />
    </div>
  );
}
