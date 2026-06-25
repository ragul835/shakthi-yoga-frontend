import React from 'react';
import { digitalMediaWaiverHtml, liabilityWaiverHtml } from '../register/waivers';
import styles from '../legal.module.css';

export default function TermsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Terms of Service</h1>
        <p className={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className={styles.content}>
          <div style={{ marginBottom: '48px' }}>
            <h2>Waiver of Liability and Release</h2>
            <div dangerouslySetInnerHTML={{ __html: liabilityWaiverHtml }} />
          </div>

          <div>
            <h2>Digital Media Waiver</h2>
            <div dangerouslySetInnerHTML={{ __html: digitalMediaWaiverHtml }} />
          </div>
        </div>
      </div>
    </div>
  );
}
