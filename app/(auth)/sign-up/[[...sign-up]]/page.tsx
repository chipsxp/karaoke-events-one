import { SignUp } from "@clerk/nextjs";

const SignUpPage = () => {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      <SignUp
        routing="path"
        path="/sign-up"
        forceRedirectUrl="/role-selection"
        appearance={{
          elements: {
            formButtonPrimary: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
            card: "bg-white/95 backdrop-blur-sm",
          },
        }}
      />
    </div>
  );
};

export default SignUpPage;