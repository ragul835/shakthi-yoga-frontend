"use client";

import { Download } from "lucide-react";
import { usePwaInstall } from "@/components/PwaRegistration";

interface PwaInstallButtonProps {
  className?: string;
  onInstalled?: () => void;
}

export default function PwaInstallButton({
  className = "btn btn-secondary",
  onInstalled,
}: PwaInstallButtonProps) {
  const { canInstall, install } = usePwaInstall();

  if (!canInstall) return null;

  const handleInstall = async () => {
    const outcome = await install();
    if (outcome === "accepted") onInstalled?.();
  };

  return (
    <button type="button" className={className} onClick={() => void handleInstall()}>
      <Download size={16} aria-hidden="true" />
      Install App
    </button>
  );
}
