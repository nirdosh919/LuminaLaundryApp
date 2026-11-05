import React from 'react';
import WebsitePage from '@/components/website-page';

export default function Screen() {
  return <WebsitePage title="Privacy Policy" description="Understand how account and service information is handled." sections={["Information collected", "How information is used", "Your choices"]} actions={[]} />;
}

