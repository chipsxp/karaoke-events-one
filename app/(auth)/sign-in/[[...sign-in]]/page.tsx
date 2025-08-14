import { SignIn } from "@clerk/nextjs";

const SignInPage = () => {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      <SignIn
        routing="path"
        path="/sign-in"
        forceRedirectUrl="/dashboard"
      />
    </div>
  );
};

export default SignInPage;