import { timetableModule } from "./timetable/index.js";
import { wifiModule } from "./wifi/index.js";

/** Feature modules registered for routing. Disabled entries stay out of the app. */
export const modules = [timetableModule, wifiModule];

export function enabledModules() {
  return modules.filter((mod) => mod.enabled);
}
