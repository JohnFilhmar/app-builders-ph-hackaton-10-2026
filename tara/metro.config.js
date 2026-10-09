const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// three >=0.185 ships a deprecated CJS shim (three.cjs) that calls Node's process.emitWarning, which React Native
// lacks. @react-three/fiber/native require()s three and lands on that shim, so route every `three` import to the
// ES module build. This also guarantees one shared copy of three for R3F and GLTFLoader.
const THREE_ESM = path.resolve(__dirname, 'node_modules/three/build/three.module.js');
const defaultResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'three') return { type: 'sourceFile', filePath: THREE_ESM };
  return (defaultResolve ?? context.resolveRequest)(context, moduleName, platform);
};

config.resolver.assetExts.push('glb');

module.exports = withNativeWind(config, { input: './src/global.css' });
