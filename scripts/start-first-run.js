const { spawn } = require("node:child_process");
const { randomBytes } = require("node:crypto");

const session = randomBytes(5).toString("hex");
const expo = spawn(
  process.execPath,
  [require.resolve("expo/bin/cli"), "start", "--go", "--lan", "--port", "8084"],
  {
    env: { ...process.env, ASANAVI_FIRST_RUN_SESSION: session },
    stdio: "inherit",
  },
);

expo.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
expo.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal === "SIGINT" ? 130 : 1);
});
