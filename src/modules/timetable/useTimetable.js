import { useEffect, useState } from "react";
import { DATA_URL } from "./lib.js";

/** Fetches generated timetable JSON once; cancels on unmount. */
export function useTimetableData() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(DATA_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${DATA_URL}`);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, error };
}

/**
 * Keeps the primary selector on a valid option when the list changes.
 * @param {Array<{id: string}>} options
 * @return {[string, function(string): void]}
 */
export function usePrimaryId(options) {
  const [primaryId, setPrimaryId] = useState("");

  useEffect(() => {
    if (!options.length) {
      setPrimaryId("");
      return;
    }
    if (!options.some((option) => option.id === primaryId)) {
      setPrimaryId(options[0].id);
    }
  }, [options, primaryId]);

  return [primaryId, setPrimaryId];
}
