import { SignIn } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <SignIn
          appearance={{
            elements: {
              formButtonPrimary: "bg-primary hover:bg-primary/90",
              footerActionLink: "text-primary hover:text-primary/90",
            },
          }}
        />
      </div>
    </div>
  );
} 