import { RepositoryError } from "../repository-error";

describe("RepositoryError", () => {
  it("keeps a stable error category and original cause", () => {
    const cause = new Error("database is unavailable");
    const error = new RepositoryError(
      "open_failed",
      "保存先を開けませんでした",
      cause,
    );

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("RepositoryError");
    expect(error.code).toBe("open_failed");
    expect(error.message).toBe("保存先を開けませんでした");
    expect(error.cause).toBe(cause);
  });
});
