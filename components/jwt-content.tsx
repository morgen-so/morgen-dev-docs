"use client";

import { useSearchParams } from "next/navigation";
import { ReactNode, Suspense } from "react";

interface JwtContentProps {
  children: ReactNode;
}

function JwtContentInner({ children }: JwtContentProps) {
  const searchParams = useSearchParams();
  const showJwt = searchParams.get("showJwt") === "true";

  if (!showJwt) {
    return null;
  }

  return <>{children}</>;
}

export function JwtContent({ children }: JwtContentProps) {
  return (
    <Suspense fallback={null}>
      <JwtContentInner>{children}</JwtContentInner>
    </Suspense>
  );
}

