import { router } from "expo-router";

import { ScheduleSetupScreen } from "@/features/schedule-setup/schedule-setup-screen";
import { saveWeekdaySchedulesToDatabase } from "@/infrastructure/app-services/save-weekday-schedules";

export default function ScheduleSetupRoute() {
  return (
    <ScheduleSetupScreen
      onSave={saveWeekdaySchedulesToDatabase}
      onSaved={() => router.navigate("/setup/overrides")}
    />
  );
}
