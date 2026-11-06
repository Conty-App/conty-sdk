import { withDeps } from "@conty/core";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Linking, Platform } from "react-native";
import { createClient } from "./client";
import type { Conty, ContyOptions } from "./types";

export function createConty(options: ContyOptions = {}): Conty {
  return createClient({
    ...withDeps(options),
    storage: options.storage ?? AsyncStorage,
    linking: options.linking ?? Linking,
    platform: options.platform ?? Platform,
  });
}
