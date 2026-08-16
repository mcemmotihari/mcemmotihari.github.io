import { Panel } from "../../ui/Panel.jsx";

export default function WifiPage() {
  return (
    <div className="page-body">
      <Panel className="stub-note">
        <p>
          Nothing to show yet. Add the campus / hostel SSIDs in{" "}
          <code>src/modules/wifi</code> — this route is already wired in{" "}
          <code>src/modules/registry.js</code>.
        </p>
      </Panel>
    </div>
  );
}
