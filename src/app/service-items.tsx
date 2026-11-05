import React from "react";
import LocalFeaturePage from "../components/LocalFeaturePage";

export default function Screen() {
  return <LocalFeaturePage
    title="Service catalogue"
    storageKey="lumina_service_items"
    fields={["Service name", "Category", "Price", "Description"]}
  />;
}
