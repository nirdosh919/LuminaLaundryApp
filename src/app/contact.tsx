import React from 'react';
import WebsitePage from '@/components/website-page';

export default function Screen() {
  return <WebsitePage
    title="Contact Us"
    description="Get help with bookings, laundry services or general enquiries."
    sections={["Customer support", "Service enquiry", "Business enquiry"]}
    fields={[
      { label: "Name", placeholder: "Your name" },
      { label: "Email", placeholder: "you@example.com" },
      { label: "Message", placeholder: "How can we help?", multiline: true },
    ]}
    storageKey="lumina_contact_enquiries"
    actions={[{ label: "Open Support", route: "/support" }]}
  />;
}
