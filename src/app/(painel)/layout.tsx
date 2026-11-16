import { Suspense } from "react";
import { AppHeader, HeaderFallback } from "@/components/app-header";

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full">
      <Suspense fallback={<HeaderFallback />}>
        <AppHeader />
      </Suspense>
      <div className="mx-auto w-full max-w-6xl px-4 py-6">{children}</div>
    </div>
  );
}
