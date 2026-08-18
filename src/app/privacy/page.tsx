import React from 'react';
import styles from '../legal.module.css';

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.lastUpdated}>Effective August 18, 2026 · Privacy version 2026-08-18</p>
        
        <div className={styles.content}>
          <p>
            Shakthi Yoga, operated by Saranya Prabakaran, is responsible for the personal information described in this policy. Contact <a href="mailto:raji.saran2010@gmail.com">raji.saran2010@gmail.com</a> with privacy questions, requests, or complaints.
          </p>

          <h2>Information We Collect</h2>
          <p>
            We may collect account and contact details; class, pass, attendance, and verification records; emergency-contact details; physical and mental health information you choose or are required to provide for safe participation; waiver and consent records; messages, testimonials, and newsletter preferences; and limited device, operational-log, cookie, and error-reporting data.
          </p>

          <h2>How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Manage your account and class registrations.</li>
            <li>Ensure your safety during classes by being aware of any health conditions.</li>
            <li>Communicate with you regarding schedule changes, new classes, and updates.</li>
            <li>Provide a personalized and supportive yoga experience.</li>
            <li>Verify requests, prevent abuse, secure accounts, troubleshoot errors, and meet legal obligations.</li>
          </ul>

          <h2>Sensitive information and emergency contacts</h2>
          <p>Health and emergency-contact information is used for participant safety and service administration. Provide another person&apos;s details only when you are authorized to do so. Access should be limited to people who need it for these purposes.</p>

          <h2>Service providers and transfers</h2>
          <p>We may use hosting, database, email, file-storage, logging, and error-monitoring providers to operate the service. Those providers process information under their own infrastructure and may store it in another country. We require appropriate safeguards where applicable. This website does not collect online card or bank credentials.</p>

          <h2>Retention</h2>
          <p>We retain account and operational data only as long as needed for the service, safety, legal, tax, dispute, and audit purposes. Consent and waiver records may need longer retention. Data is deleted or anonymized when no longer required, subject to backups and legal holds.</p>

          <h2>Your choices and rights</h2>
          <p>Depending on your location, you may request access, correction, deletion, restriction, portability, or objection. You may unsubscribe from marketing using the unsubscribe method in a message or by contacting us. Operational communications about an active request or account are not marketing.</p>

          <h2>Children and guardians</h2>
          <p>A parent or legal guardian must authorize participation and data processing for a minor where required. Do not create a minor&apos;s account without the legally required guardian involvement.</p>

          <h2>Cookies, logs, and security incidents</h2>
          <p>We use storage and cookies needed for sessions and core operation. Operational logs and sanitized error reports help secure and maintain the service. We do not intend to place passwords, tokens, health details, or message contents in routine logs. If a breach creates a legally reportable risk, we will investigate, contain it, and notify affected people and authorities as required.</p>

          <h2>Data Protection</h2>
          <p>
            We use administrative and technical safeguards intended to protect personal information. No system is completely secure. We do not sell personal information or disclose it to third parties for their independent marketing.
          </p>

          <h2>Contact Us</h2>
          <p>
            If you have any questions or concerns about our Privacy Policy or how your data is handled, please contact us at raji.saran2010@gmail.com.
          </p>
        </div>
      </div>
    </div>
  );
}
