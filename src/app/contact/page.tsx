'use client';

import { FormEvent, useState } from 'react';
import { CheckCircle, Mail, MapPin, Phone, Send } from 'lucide-react';
import { apiPost } from '@/lib/api';
import { useCmsPage } from '@/lib/cms';
import styles from '../about/about.module.css';

export default function ContactPage() {
  const cms = useCmsPage('contact');
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');
    setErrorMessage('');
    try {
      await apiPost('/contact', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: `New inquiry from ${formData.name.trim()}`,
        message: formData.message.trim(),
      });
      setFormData({ name: '', email: '', message: '' });
      setStatus('success');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to send your message. Please try again.');
      setStatus('error');
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className="container">
          <p className={styles.subtext}>Get in touch</p>
          <h1 className={styles.title}>We’d love to hear from you</h1>
        </div>
      </section>
      <section className={styles.contactSection} aria-labelledby="contact-heading">
        <div className="container">
          <div className={styles.contactHeader}>
            <p className={styles.subtext}>Contact Shakthi Yoga</p>
            <h2 id="contact-heading">Begin your practice with us</h2>
          </div>
          <div className={styles.contactGrid}>
            <div className={styles.contactLeft}>
              <a href={cms.mapUrl} target="_blank" rel="noopener noreferrer" className={styles.contactMap}>
                <MapPin size={32} className={styles.contactMapIcon} />
                <div className={styles.contactMapText}>{cms.locationLabel}<br /><span>View on Google Maps →</span></div>
              </a>
              <div className={styles.contactInfoList}>
                <div className={styles.contactInfoItem}><MapPin size={20} /><span>{cms.location}</span></div>
                <div className={styles.contactInfoItem}><Phone size={20} /><a href={`tel:${cms.phone.replace(/[^+\d]/g, '')}`}>{cms.phone}</a></div>
                <div className={styles.contactInfoItem}><Mail size={20} /><a href={`mailto:${cms.email}`}>{cms.email}</a></div>
              </div>
            </div>
            <div className={styles.contactRight}>
              {status === 'success' ? (
                <div className={styles.contactForm} role="status">
                  <CheckCircle size={52} aria-hidden="true" />
                  <h3>Message sent</h3>
                  <p>Thank you. We’ll get back to you shortly.</p>
                  <button type="button" className="btn btn-secondary" onClick={() => setStatus('idle')}>Send another message</button>
                </div>
              ) : (
                <form className={styles.contactForm} onSubmit={submit}>
                  {status === 'error' && <p role="alert">{errorMessage}</p>}
                  <div className={styles.formGroup}><label className={styles.formLabel} htmlFor="contact-name">Name</label><input id="contact-name" className={styles.formInput} value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} required disabled={status === 'loading'} autoComplete="name" /></div>
                  <div className={styles.formGroup}><label className={styles.formLabel} htmlFor="contact-email">Email</label><input id="contact-email" type="email" className={styles.formInput} value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} required disabled={status === 'loading'} autoComplete="email" /></div>
                  <div className={styles.formGroup}><label className={styles.formLabel} htmlFor="contact-message">Message</label><textarea id="contact-message" className={styles.formTextarea} value={formData.message} onChange={(event) => setFormData({ ...formData, message: event.target.value })} required minLength={10} maxLength={2000} disabled={status === 'loading'} rows={6} /></div>
                  <button type="submit" className={styles.submitBtn} disabled={status === 'loading'}><Send size={18} aria-hidden="true" />{status === 'loading' ? 'Sending…' : 'Send message'}</button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
