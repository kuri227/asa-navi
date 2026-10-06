import { router } from "expo-router";

import { OverrideSetupScreen } from "@/features/override-setup/override-setup-screen";
import { saveDateOverridesToDatabase } from "@/infrastructure/app-services/save-date-overrides";

export default function OverridesSetupRoute() {
  return (
    <OverrideSetupScreen
      onSave={saveDateOverridesToDatabase}
      onSaved={() => router.navigate("/setup/routine")}
    />
  );
}
