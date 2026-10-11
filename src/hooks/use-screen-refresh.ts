import { useCallback, useRef, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";

// Listen only while this route is visible, so hidden screens do not reload DBs.
export function useScreenRefresh(): number {
  const [version, setVersion] = useState(0);
  const hasFocused = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (hasFocused.current) setVersion((current) => current + 1);
      hasFocused.current = true;
      let previousState = AppState.currentState;
      const subscription = AppState.addEventListener("change", (nextState) => {
        if (nextState === "active" && previousState !== "active") {
          setVersion((current) => current + 1);
        }
        previousState = nextState;
      });
      return () => subscription.remove();
    }, []),
  );
  return version;
}
