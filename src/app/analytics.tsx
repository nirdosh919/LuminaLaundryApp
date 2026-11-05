import React from "react";
import LocalFeaturePage from "../components/LocalFeaturePage";

export default function Screen() {
  return <LocalFeaturePage
    title="Analytics"
    storageKey="lumina_analytics"
    fields={["Metric name", "Metric value", "Reporting date", "Notes"]}
  />;
}
