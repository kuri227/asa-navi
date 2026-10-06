import { router } from "expo-router";

import { OnboardingScreen } from "@/features/onboarding/onboarding-screen";

export default function OnboardingRoute() {
  return <OnboardingScreen onStart={() => router.navigate("/setup/route")} />;
}
