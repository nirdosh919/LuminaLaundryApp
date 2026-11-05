import React from 'react';
import WebsitePage from '@/components/website-page';

export default function Screen() {
  return <WebsitePage
    title="Franchise Opportunities"
    description="Explore partnership and franchise enquiries with Lumina Laundry."
    sections={["Partnership overview", "Operating support", "Enquiry details"]}
    fields={[
      { label: "Full name", placeholder: "Your name" },
      { label: "Phone", placeholder: "10-digit mobile number" },
      { label: "City", placeholder: "Your city" },
      { label: "Message", placeholder: "Tell us about your interest", multiline: true },
    ]}
    storageKey="lumina_franchise_enquiries"
  />;
}
