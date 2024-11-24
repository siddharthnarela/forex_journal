module.exports = {
  presets: [
    'babel-preset-expo', // This preset is necessary for Expo projects
  ],
  plugins: [
    // "nativewind/babel",
    'react-native-reanimated/plugin', // Reanimated plugin for handling animations
  ],
};


// module.exports = function (api) {
//   api.cache(true);
//   return {
//     presets: ["babel-preset-expo"], // Use the Expo preset
//     plugins: [
//       "nativewind/babel", // NativeWind plugin
//       "react-native-reanimated/plugin", // Reanimated plugin, always last
//     ],
//   };
// };
