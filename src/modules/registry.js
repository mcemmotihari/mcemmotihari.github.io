import { timetableModule } from "./timetable/index.js";
import { wifiModule } from "./wifi/index.js";

export const modules = [timetableModule, wifiModule];

export function enabledModules() {
  return modules.filter((m) => m.enabled);
}
