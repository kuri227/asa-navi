import { router } from "expo-router";

import { RoutineSetupScreen } from "@/features/routine-setup/routine-setup-screen";
import { saveMorningRoutineToDatabase } from "@/infrastructure/app-services/save-morning-routine";

export default function RoutineSetupRoute() {
  return (
    <RoutineSetupScreen
      onSave={saveMorningRoutineToDatabase}
      onSaved={() => router.navigate("/setup/notifications")}
    />
  );
}
