import { router } from "expo-router";

import { RouteSetupScreen } from "@/features/route-setup/route-setup-screen";
import { saveCommuteRouteToDatabase } from "@/infrastructure/app-services/save-commute-route";

export default function RouteSetupRoute() {
  return (
    <RouteSetupScreen
      onSave={saveCommuteRouteToDatabase}
      onSaved={() => router.navigate("/setup/schedule")}
    />
  );
}
