import VendorFeaturePage from "../components/VendorFeaturePage";

export default function Screen() {
  return <VendorFeaturePage
    title="Service catalogue"
    subtitle="Keep the services, prices and care notes your shop offers up to date."
    icon="◇"
    storageKey="lumina_vendor_services"
    fields={["Service name", "Price", "Turnaround time", "Description"]}
  />;
}
