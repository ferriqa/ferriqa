import { getRuntimeInfo } from "./runtime";

const info = getRuntimeInfo();
console.log(
  `📜 Ferriqa is starting on ${info.name} (Version: ${info.version})`,
);
