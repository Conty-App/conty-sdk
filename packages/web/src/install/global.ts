import { browserPorts } from "../ports/browser";
import { install } from "./install";

const script = document.currentScript;

install(window, script instanceof HTMLScriptElement ? script : null, browserPorts());
