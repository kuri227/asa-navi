import { openDatabaseAsync } from "expo-sqlite";

import { withDatabaseTransaction } from "../database-transaction.web";

const mockTransaction = {
  execAsync: jest.fn(async () => undefined),
  closeAsync: jest.fn(async () => undefined),
  withTransactionAsync: jest.fn(async (task: () => Promise<void>) => task()),
};

jest.mock("expo-sqlite", () => ({
  openDatabaseAsync: jest.fn(async () => mockTransaction),
}));

describe("Web database transactions", () => {
  const database = { databasePath: "./asanavi.db", options: {} };

  beforeEach(() => jest.clearAllMocks());

  it("uses a separate connection, enables constraints and closes after success", async () => {
    const task = jest.fn(async () => undefined);
    await withDatabaseTransaction(database, task);
    expect(openDatabaseAsync).toHaveBeenLastCalledWith("asanavi.db", {
      useNewConnection: true,
    });
    expect(mockTransaction.execAsync).toHaveBeenCalledWith(
      "PRAGMA foreign_keys = ON",
    );
    expect(task).toHaveBeenCalledWith(mockTransaction);
    expect(mockTransaction.withTransactionAsync).toHaveBeenCalledTimes(1);
    expect(mockTransaction.closeAsync).toHaveBeenCalledTimes(1);
  });

  it("preserves a failed write and still closes the transaction connection", async () => {
    const cause = new Error("write failed");
    await expect(
      withDatabaseTransaction(database, async () => {
        throw cause;
      }),
    ).rejects.toBe(cause);
    expect(mockTransaction.closeAsync).toHaveBeenCalledTimes(1);
  });
});
