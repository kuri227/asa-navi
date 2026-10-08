import { router } from "expo-router";

import { HomeScreen } from "@/features/home/home-screen";
import { loadTomorrowPlanFromDatabase } from "@/infrastructure/app-services/load-tomorrow-plan";

export default function HomeRoute() {
  return (
    <HomeScreen
      loadPlan={loadTomorrowPlanFromDatabase}
      onEditTomorrow={(targetDate) =>
        router.push({ pathname: "/tomorrow-override", params: { targetDate } })
      }
    />
  );
}
