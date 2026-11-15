import { openDatabaseAsync } from "expo-sqlite";

import { withDatabaseTransaction } from "../database-transaction";

const mockConnection = {
  execAsync: jest.fn(async () => undefined),
  withTransactionAsync: jest.fn((task: () => Promise<void>) => task()),
  closeAsync: jest.fn(async () => undefined),
};

jest.mock("expo-sqlite", () => ({
  openDatabaseAsync: jest.fn(async () => mockConnection),
}));

describe("Native database transactions", () => {
  const database = { databasePath: "/app/storage/asanavi.db", options: {} };

  beforeEach(() => jest.clearAllMocks());

  it("enables foreign keys on the isolated connection before beginning the transaction", async () => {
    const task = jest.fn(async () => undefined);
    await withDatabaseTransaction(database, task);
    expect(openDatabaseAsync).toHaveBeenCalledWith(
      "asanavi.db",
      { useNewConnection: true },
      "/app/storage",
    );
    expect(mockConnection.execAsync).toHaveBeenCalledWith(
      "PRAGMA foreign_keys = ON",
    );
    expect(mockConnection.execAsync.mock.invocationCallOrder[0]).toBeLessThan(
      mockConnection.withTransactionAsync.mock.invocationCallOrder[0],
    );
    expect(task).toHaveBeenCalledWith(mockConnection);
    expect(mockConnection.closeAsync).toHaveBeenCalledTimes(1);
  });

  it("closes the separate connection when an operation throws", async () => {
    const cause = new Error("transaction failed");
    await expect(
      withDatabaseTransaction(database, async () => {
        throw cause;
      }),
    ).rejects.toBe(cause);
    expect(mockConnection.closeAsync).toHaveBeenCalledTimes(1);
  });
});
