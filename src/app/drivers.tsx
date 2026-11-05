import React from "react";
import LocalFeaturePage from "../components/LocalFeaturePage";

export default function Screen() {
  return <LocalFeaturePage
    title="Drivers"
    storageKey="lumina_drivers"
    fields={["Driver name", "Phone", "Vehicle details", "Availability"]}
  />;
}
