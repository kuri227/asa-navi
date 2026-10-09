import {
  getMorningAlarmSessionId,
  observeMorningAlarmResponses,
  type NotificationResponseGateway,
} from "../observe-morning-alarm-responses";

jest.mock("expo-notifications", () => ({
  getLastNotificationResponse: jest.fn(),
  clearLastNotificationResponse: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
}));

describe("observeMorningAlarmResponses", () => {
  it("opens and consumes the last response on a cold start", () => {
    const response = morningResponse("session-cold");
    const { gateway, clearLastResponse } = createGateway(response);
    const openMorningSession = jest.fn();

    const unsubscribe = observeMorningAlarmResponses(
      openMorningSession,
      gateway,
      "android",
    );

    expect(openMorningSession).toHaveBeenCalledWith("session-cold");
    expect(clearLastResponse).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("opens a session from a response received while running", () => {
    const { gateway, emit, remove } = createGateway(null);
    const openMorningSession = jest.fn();

    const unsubscribe = observeMorningAlarmResponses(
      openMorningSession,
      gateway,
      "ios",
    );
    emit(morningResponse("session-live"));

    expect(openMorningSession).toHaveBeenCalledWith("session-live");
    unsubscribe();
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it("ignores untrusted or malformed notification data", () => {
    expect(getMorningAlarmSessionId(null)).toBeNull();
    expect(getMorningAlarmSessionId({ type: "other", sessionId: "1" })).toBe(
      null,
    );
    expect(
      getMorningAlarmSessionId({ type: "morning-alarm", sessionId: "  " }),
    ).toBeNull();
  });

  it("does not access the native notification API on web", () => {
    const { gateway, getLastResponse, addResponseListener } =
      createGateway(null);

    observeMorningAlarmResponses(jest.fn(), gateway, "web")();

    expect(getLastResponse).not.toHaveBeenCalled();
    expect(addResponseListener).not.toHaveBeenCalled();
  });
});

function morningResponse(sessionId: string) {
  return {
    data: { type: "morning-alarm", sessionId },
  };
}

function createGateway(
  lastResponse: ReturnType<typeof morningResponse> | null,
) {
  let listener: (response: ReturnType<typeof morningResponse>) => void = () =>
    undefined;
  const remove = jest.fn();
  const getLastResponse = jest.fn(() => lastResponse);
  const clearLastResponse = jest.fn();
  const addResponseListener = jest.fn((nextListener) => {
    listener = nextListener;
    return { remove };
  });
  const gateway: NotificationResponseGateway = {
    getLastResponse,
    clearLastResponse,
    addResponseListener,
  };
  return {
    gateway,
    getLastResponse,
    clearLastResponse,
    addResponseListener,
    remove,
    emit: (response: ReturnType<typeof morningResponse>) => listener(response),
  };
}
