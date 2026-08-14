"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface PwaInstallButtonProps {
  className?: string;
  onInstalled?: () => void;
}

export default function PwaInstallButton({
  className = "btn btn-secondary",
  onInstalled,
}: PwaInstallButtonProps) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && navigator.standalone === true);

    if (standalone) return;

    const handleBeforeInstallPrompt = (event: Event) => {
      // Use the browser's verified PWA installation flow. A generic home-screen
      // shortcut can carry a Chrome badge and does not provide the same lifecycle.
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (!installPrompt) return null;

  const install = async () => {
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (choice.outcome === "accepted") onInstalled?.();
  };

  return (
    <button type="button" className={className} onClick={() => void install()}>
      <Download size={16} aria-hidden="true" />
      Install App
    </button>
  );
}
