export const wifiModule = {
  id: "wifi",
  title: "Campus Wi-Fi",
  navLabel: "Wi-Fi",
  blurb: "SSID / login notes. Empty for now — hook the page up when the list is ready.",
  path: "/wifi",
  enabled: true,
  load: () => import("./WifiPage.jsx"),
};
