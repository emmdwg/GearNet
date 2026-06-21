import { Suspense } from "react";
import SignInForm from "./SignInForm";

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-zinc-500">Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}
