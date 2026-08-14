"use client";

import Image from "next/image";
import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePwaInstall } from "@/components/PwaRegistration";
import styles from "./PwaInstallBanner.module.css";

const DISMISSED_KEY = "shakthi-pwa-install-dismissed";

export default function PwaInstallBanner() {
  const { canInstall, install } = usePwaInstall();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDismissed(sessionStorage.getItem(DISMISSED_KEY) === "true");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!canInstall || dismissed) return null;

  const dismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, "true");
    setDismissed(true);
  };

  const handleInstall = async () => {
    const outcome = await install();
    if (outcome !== "unavailable") dismiss();
  };

  return (
    <aside className={styles.banner} aria-label="Install Shakthi Yoga app">
      <button
        type="button"
        className={styles.installArea}
        onClick={() => void handleInstall()}
      >
        <Image
          src="/icons/icon-192.png?v=2"
          alt=""
          width={56}
          height={56}
          className={styles.icon}
          priority
        />
        <span className={styles.copy}>
          <strong>Install Shakthi Yoga</strong>
          <span>Add to your home screen</span>
        </span>
        <Download size={20} className={styles.download} aria-hidden="true" />
      </button>
      <button type="button" className={styles.close} onClick={dismiss} aria-label="Dismiss install prompt">
        <X size={20} aria-hidden="true" />
      </button>
    </aside>
  );
}
