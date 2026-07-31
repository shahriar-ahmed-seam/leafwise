import type { Metadata } from "next";

import ScanConsole from "@/components/ScanConsole";

export const metadata: Metadata = {
  title: "Scanner",
  description:
    "Scan a leaf with your camera or a photo. Inference runs on this device, offline, in about a second.",
};

export default function ScanPage() {
  return <ScanConsole />;
}
