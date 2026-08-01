'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './pricing.module.css';
import { apiGet, apiPost } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface PassOption {
  id: string;
  name: string;
  description: string;
  priceUsd: string;
  totalClasses: number | null;
  validityDays: number | null;
}

export default function PricingPage() {
  const [options, setOptions] = useState<PassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const data = await apiGet('/passes/options');
      setOptions(data as PassOption[]);
    } catch (err: any) {
      setError(err.message || 'Failed to load passes');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (optionId: string) => {
    if (!user) {
      router.push('/signin?redirect=/pricing');
      return;
    }

    setPurchasing(optionId);
    setError('');
    setSuccess('');

    try {
      await apiPost(`/passes/purchase/${optionId}`, {});
      setSuccess('Pass purchased successfully! (Simulated)');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to purchase pass');
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div className={styles.pricingContainer}>
      <h1 className={styles.title}>Class Passes</h1>
      <p className={styles.subtitle}>Choose the perfect pass for your yoga journey.</p>
      
      {error && <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
      {success && <div className="success-message" style={{ color: 'green', marginBottom: '1rem' }}>{success}</div>}

      {loading ? (
        <p>Loading passes...</p>
      ) : (
        <div className={styles.grid}>
          {options.map((option) => (
            <div key={option.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.passName}>{option.name}</h2>
                <div className={styles.passPrice}>${Number(option.priceUsd).toFixed(2)}</div>
                <p className={styles.passDescription}>{option.description}</p>
              </div>
              
              <ul className={styles.features}>
                <li>{option.totalClasses ? `${option.totalClasses} Classes` : 'Unlimited Classes'}</li>
                <li>{option.validityDays ? `Valid for ${option.validityDays} days` : 'No expiry date'}</li>
                <li>Access to all regular classes</li>
              </ul>

              <button 
                className={styles.buyButton}
                onClick={() => handlePurchase(option.id)}
                disabled={purchasing === option.id}
              >
                {purchasing === option.id ? 'Processing...' : 'Buy Now'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
