import { conty } from "@conty/react-native";
import { AppRegistry } from "react-native";
import App from "./App";

conty.init("cpk_SUA_CHAVE");

AppRegistry.registerComponent("MeuApp", () => App);
