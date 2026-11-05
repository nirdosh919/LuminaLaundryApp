import React from "react";
import LocalFeaturePage from "../components/LocalFeaturePage";

export default function Screen() {
  return <LocalFeaturePage
    title="Customers"
    storageKey="lumina_customers"
    fields={["Customer name", "Phone", "Email", "Notes"]}
  />;
}
