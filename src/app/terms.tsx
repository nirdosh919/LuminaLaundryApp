import React from 'react';
import WebsitePage from '@/components/website-page';

export default function Screen() {
  return <WebsitePage title="Terms and Conditions" description="Review the terms that apply when using Lumina Laundry services." sections={["Service terms", "Bookings and cancellations", "Payments and liability"]} actions={[]} />;
}

