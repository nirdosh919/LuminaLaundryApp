import VendorFeaturePage from "../components/VendorFeaturePage";

export default function Screen() {
  return <VendorFeaturePage
    title="Opening schedule"
    subtitle="Set the hours your team accepts pickups and prepares orders."
    icon="◷"
    storageKey="lumina_vendor_schedule"
    fields={["Day or date", "Opening time", "Closing time", "Notes"]}
  />;
}
