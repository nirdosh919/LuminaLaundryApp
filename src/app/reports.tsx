import React from "react";
import LocalFeaturePage from "../components/LocalFeaturePage";

export default function Screen() {
  return <LocalFeaturePage
    title="Revenue reports"
    storageKey="lumina_reports"
    fields={["Report title", "Date range", "Revenue notes", "Expenses / commission notes"]}
  />;
}
