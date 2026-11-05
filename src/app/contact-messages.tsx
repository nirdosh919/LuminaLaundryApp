import React from 'react';
import WebsitePage from '@/components/website-page';

export default function Screen() {
  return <WebsitePage title="Contact Messages" description="Review customer enquiries in the management workspace." sections={["Open enquiries", "Resolved enquiries"]} actions={[]} />;
}

