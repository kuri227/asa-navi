import { router } from "expo-router";

import { HomeScreen } from "@/features/home/home-screen";
import { loadHomeDashboardFromDatabase } from "@/infrastructure/app-services/load-tomorrow-plan";

export default function HomeRoute() {
  return (
    <HomeScreen
      loadPlan={loadHomeDashboardFromDatabase}
      onEditTomorrow={(targetDate) =>
        router.push({ pathname: "/tomorrow-override", params: { targetDate } })
      }
      onStartMorning={(sessionId) =>
        router.push({ pathname: "/morning/start", params: { sessionId } })
      }
    />
  );
}
