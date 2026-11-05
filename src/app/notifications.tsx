import React from "react";
import LocalFeaturePage from "../components/LocalFeaturePage";

export default function Screen() {
  return <LocalFeaturePage
    title="Notifications"
    storageKey="lumina_notifications"
    fields={["Notification title", "Message", "Related order"]}
  />;
}
