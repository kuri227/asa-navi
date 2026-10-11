const { getDefaultConfig } = require("expo/metro-config");

/** @type {import("expo/metro-config").MetroConfig} */
const config = getDefaultConfig(__dirname);

// expo-sqlite's Web worker loads SQLite as WebAssembly.
config.resolver.assetExts.push("wasm");

// SharedArrayBuffer requires cross-origin isolation in local Web development.
config.server.enhanceMiddleware = (middleware) => {
  return (request, response, next) => {
    response.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
    response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    middleware(request, response, next);
  };
};

module.exports = config;
