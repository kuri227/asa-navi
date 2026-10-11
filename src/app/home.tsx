import { router } from "expo-router";

import { HomeScreen } from "@/features/home/home-screen";
import { useScreenRefresh } from "@/hooks/use-screen-refresh";
import { loadHomeDashboardFromDatabase } from "@/infrastructure/app-services/load-tomorrow-plan";

export default function HomeRoute() {
  const refreshVersion = useScreenRefresh();
  return (
    <HomeScreen
      refreshVersion={refreshVersion}
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
