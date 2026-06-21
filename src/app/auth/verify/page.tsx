import { Suspense } from "react";
import VerifyEmailPage from "./VerifyEmailClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex min-h-[80vh] items-center justify-center text-zinc-500">Loading...</div>}>
      <VerifyEmailPage />
    </Suspense>
  );
}
