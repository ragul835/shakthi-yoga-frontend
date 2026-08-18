import React from 'react';
import { DIGITAL_MEDIA_WAIVER_VERSION, digitalMediaWaiverHtml, LIABILITY_WAIVER_VERSION, liabilityWaiverHtml } from '../register/waivers';
import styles from '../legal.module.css';

export default function TermsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Terms of Service</h1>
        <p className={styles.lastUpdated}>Effective August 18, 2026 · Terms version 2026-08-18</p>
        
        <div className={styles.content}>
          <p>These terms govern use of Shakthi Yoga services operated by Saranya Prabakaran. Questions may be sent to <a href="mailto:raji.saran2010@gmail.com">raji.saran2010@gmail.com</a>.</p>

          <h2>Bookings, passes, and manual verification</h2>
          <p>Class bookings and class-pass requests shown on this website are requests only until an administrator verifies them. No online payment is collected by this website. Prices, availability, pass validity, and class capacity shown before verification may be corrected if they are inaccurate.</p>

          <h2>Cancellations, rescheduling, refunds, and no-shows</h2>
          <p>Contact Shakthi Yoga before the scheduled class to request a cancellation or reschedule. Eligibility for a refund or credit depends on the policy communicated for the relevant class or pass. Missing a class does not automatically create a refund. When an administrator issues a makeup credit, it is single-use and expires at the end of the calendar month in which the original class was missed.</p>

          <h2>Class passes and online classes</h2>
          <p>Each pass is limited by the class count and validity period displayed when requested. A class is deducted when an eligible booking is consumed. Meeting links are available only to approved participants and must not be shared. Schedules, instructors, and online availability may change when reasonably necessary.</p>

          <h2>Accounts and acceptable use</h2>
          <p>You must provide accurate information, protect your account, and use the service lawfully. We may suspend access for fraud, abuse, unsafe conduct, link sharing, or material violation of these terms.</p>

          <h2>Intellectual property</h2>
          <p>Site content, class materials, recordings, branding, and instructor materials remain the property of their respective owners and may not be copied, recorded, redistributed, or commercially exploited without written permission.</p>

          <h2>Governing terms</h2>
          <p>The governing-law and dispute provisions in the liability release below apply where legally enforceable. Consumer rights that cannot legally be waived remain unaffected.</p>

          <div style={{ marginBottom: '48px' }}>
            <h2>Waiver of Liability and Release (version {LIABILITY_WAIVER_VERSION})</h2>
            <div dangerouslySetInnerHTML={{ __html: liabilityWaiverHtml }} />
          </div>

          <div>
            <h2>Optional Digital Media Waiver (version {DIGITAL_MEDIA_WAIVER_VERSION})</h2>
            <div dangerouslySetInnerHTML={{ __html: digitalMediaWaiverHtml }} />
          </div>
        </div>
      </div>
    </div>
  );
}
