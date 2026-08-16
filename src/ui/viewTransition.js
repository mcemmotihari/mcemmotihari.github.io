import { flushSync } from "react-dom";

/** Runs a React state update inside a View Transition when the browser allows it. */
export function runViewTransition(update) {
  if (typeof document !== "undefined" && typeof document.startViewTransition === "function") {
    document.startViewTransition(() => {
      flushSync(update);
    });
    return;
  }
  update();
}
