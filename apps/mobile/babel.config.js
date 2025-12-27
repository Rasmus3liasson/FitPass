module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      ["nativewind/babel", {
        // Disable features that require reanimated
        features: {
          animations: false,
        }
      }],
    ],
    plugins: [],
  };
};
