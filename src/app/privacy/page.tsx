import React from 'react';
import styles from '../legal.module.css';

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className={styles.content}>
          <p>
            At SHAKTHI YOGA, we value your privacy and are committed to protecting your personal information.
            This Privacy Policy outlines how we collect, use, and safeguard the data you provide when using our services.
          </p>

          <h2>Information We Collect</h2>
          <p>
            When you register for classes or interact with our platform, we may collect personal information including but not limited to your name, email address, phone number, emergency contacts, and health information relevant to your yoga practice.
          </p>

          <h2>How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Manage your account and class registrations.</li>
            <li>Ensure your safety during classes by being aware of any health conditions.</li>
            <li>Communicate with you regarding schedule changes, new classes, and updates.</li>
            <li>Provide a personalized and supportive yoga experience.</li>
          </ul>

          <h2>Data Protection</h2>
          <p>
            We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. We do not sell or share your personal information with third parties for marketing purposes.
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
