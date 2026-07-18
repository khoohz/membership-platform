"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import QrScanner from "qr-scanner";
import { parseMemberQrPayload } from "@/lib/member-qr";

// Camera QR scanning via getUserMedia (spec section 8). If the camera is denied or
// unavailable, the phone-number fallback form (always rendered below on the page)
// is the path -- this component just reports why the camera isn't running.

export default function Scanner({ tenantSlug }: { tenantSlug: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (!scanning || !videoRef.current) return;

    const scanner = new QrScanner(
      videoRef.current,
      (result) => {
        const memberId = parseMemberQrPayload(result.data);
        if (memberId) {
          scanner.stop();
          router.push(`/${tenantSlug}/staff?member=${memberId}&src=scan`);
        }
      },
      { returnDetailedScanResult: true, preferredCamera: "environment" },
    );

    scanner.start().catch((err: unknown) => {
      setScanning(false);
      setCameraError(
        err instanceof Error && /denied|permission/i.test(err.message)
          ? "Camera permission denied. Use the phone number form below instead."
          : "Camera unavailable. Use the phone number form below instead.",
      );
    });

    return () => {
      scanner.destroy();
    };
  }, [scanning, router, tenantSlug]);

  return (
    <div>
      {!scanning && (
        <button type="button" onClick={() => { setCameraError(null); setScanning(true); }}>
          Scan member QR
        </button>
      )}
      {scanning && (
        <>
          {/* qr-scanner needs a visible video element to attach the stream to */}
          <video ref={videoRef} style={{ width: "100%", maxWidth: 320 }} />
          <br />
          <button type="button" onClick={() => setScanning(false)}>
            Stop camera
          </button>
        </>
      )}
      {cameraError && <p>{cameraError}</p>}
    </div>
  );
}
