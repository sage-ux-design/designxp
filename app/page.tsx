"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/common/loading-screen";
import { usePlayer } from "@/hooks/use-player";

/** Entry point: returning players go straight to their dashboard, new players to onboarding. */
export default function Home() {
  const { status, player } = usePlayer();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    router.replace(player ? "/dashboard" : "/onboarding");
  }, [status, player, router]);

  return <LoadingScreen label="INSERT COIN" />;
}
