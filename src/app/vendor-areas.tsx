import VendorFeaturePage from "../components/VendorFeaturePage";

export default function Screen() {
  return <VendorFeaturePage
    title="Service areas"
    subtitle="Define where your shop can collect and return customer orders."
    icon="⌖"
    storageKey="lumina_vendor_areas"
    fields={["Area or postal code", "Pickup available", "Delivery available", "Notes"]}
  />;
}
