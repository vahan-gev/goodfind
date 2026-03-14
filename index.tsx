import "@expo/metro-runtime";

if (typeof navigator !== "undefined" && navigator.onLine === undefined) {
    Object.defineProperty(navigator, "onLine", { get: () => true });
}

import { registerRootComponent } from "expo";

import { App } from "./src/App";

registerRootComponent(App);
