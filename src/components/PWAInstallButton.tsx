import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import QRCode from 'qrcode';
import {
  Download,
  Share,
  PlusSquare,
  X,
  ExternalLink,
  Copy,
  Check,
  QrCode,
  Smartphone,
  ShieldCheck,
  Zap,
  CheckCircle2,
} from 'lucide-react';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Check if currently inside an iframe (AI Studio preview environment)
  const isInsideIframe = typeof window !== 'undefined' && window.self !== window.top;

  // Direct installation URL
  const directUrl =
    typeof window !== 'undefined'
      ? window.location.href.includes('localhost')
        ? 'https://ais-pre-aofcmawevzrbgh4gbye6tc-682944198159.europe-west1.run.app'
        : window.location.href
      : 'https://ais-pre-aofcmawevzrbgh4gbye6tc-682944198159.europe-west1.run.app';

  // Generate QR code for mobile scanning
  useEffect(() => {
    QRCode.toDataURL(directUrl, {
      width: 240,
      margin: 1.5,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [directUrl]);

  // If already running in standalone PWA mode, don't show the button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    // If browser prompt is available directly outside iframe, trigger it
    if (isInstallable && !isInsideIframe) {
      const installed = await install();
      if (!installed) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(directUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (_err) {
      // Fallback
    }
  };

  const handleOpenDirect = () => {
    window.open(directUrl, '_blank');
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-green-700 font-black text-white shadow-lg hover:from-emerald-500 hover:to-emerald-600 active:scale-95 transition-all cursor-pointer ring-1 ring-emerald-400/30 ${
          compact ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-xs sm:text-sm'
        }`}
        title="Install Sure Odd PWA on Android or PC"
      >
        <Download className="w-3.5 h-3.5 text-emerald-100 animate-bounce" />
        <span>Install App</span>
      </button>

      {/* Complete Instant PWA Installation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl border border-emerald-700/50 bg-slate-900 p-6 sm:p-7 shadow-2xl text-slate-100 space-y-5 my-8">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <img
                  src="/icon.svg"
                  alt="Sure Odd Logo"
                  className="w-10 h-10 rounded-2xl object-contain shadow-md ring-1 ring-amber-500/40"
                />
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-1.5">
                    <span>Install Sure Odd App</span>
                    <span className="rounded-full bg-emerald-950 px-2 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-800">
                      Free PWA
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Standalone mobile experience · No app store required
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Iframe Notice & Primary 1-Click Action */}
            {isInsideIframe && (
              <div className="rounded-2xl border border-amber-500/40 bg-amber-950/30 p-3.5 text-xs text-amber-200/90 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>To Install on Android / Phone Right Now:</span>
                </div>
                <p className="leading-relaxed text-[11px] text-amber-200/80">
                  Browsers require opening the direct live URL in your mobile browser (outside the editor preview) to trigger the native home screen install prompt.
                </p>
                <button
                  onClick={handleOpenDirect}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-2.5 text-xs font-black text-white shadow-md hover:from-emerald-500 hover:to-emerald-400 active:scale-95 transition cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open in Full Browser (Direct Install)</span>
                </button>
              </div>
            )}

            {/* If outside iframe and installable, show direct button */}
            {isInstallable && !isInsideIframe && (
              <div className="rounded-2xl border border-emerald-600/50 bg-emerald-950/40 p-4 text-center space-y-2">
                <p className="text-xs font-bold text-emerald-300">
                  Your browser is ready to install Sure Odd directly!
                </p>
                <button
                  onClick={async () => {
                    await install();
                    setShowModal(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs sm:text-sm font-black text-white shadow-lg hover:bg-emerald-500 active:scale-95 transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Tap Here to Install Immediately</span>
                </button>
              </div>
            )}

            {/* Direct URL Box + Copy Button */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Direct Installation URL:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={directUrl}
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300 font-mono focus:outline-hidden select-all"
                />
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700 transition cursor-pointer shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* QR Code for Mobile Phone Installation */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col sm:flex-row items-center gap-4">
              {qrCodeDataUrl ? (
                <div className="p-2 bg-white rounded-xl shadow-md shrink-0">
                  <img
                    src={qrCodeDataUrl}
                    alt="Scan to Install on Android"
                    className="w-28 h-28 object-contain"
                  />
                </div>
              ) : (
                <div className="w-28 h-28 rounded-xl bg-slate-800 flex items-center justify-center text-xs text-slate-500">
                  <QrCode className="w-8 h-8 text-slate-600" />
                </div>
              )}

              <div className="space-y-1 text-center sm:text-left">
                <span className="text-xs font-black text-white flex items-center justify-center sm:justify-start gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  Scan with Phone Camera to Install
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Point your Android camera or Google Lens at this code to open the app on your mobile device instantly.
                </p>
                <div className="pt-1 flex flex-wrap gap-2 justify-center sm:justify-start text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Offline Scores
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Zero Storage Lag
                  </span>
                </div>
              </div>
            </div>

            {/* Step-by-Step Mobile Instructions */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Installation Steps on Mobile:
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* Android Steps */}
                <div className="rounded-2xl bg-slate-950 p-3.5 border border-slate-800 space-y-1.5">
                  <span className="font-bold text-emerald-400 text-[11px] flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5" /> On Android (Chrome / Edge):
                  </span>
                  <ol className="text-[11px] text-slate-300 space-y-1 list-decimal list-inside leading-relaxed">
                    <li>Open direct URL in Chrome.</li>
                    <li>
                      Tap the <strong className="text-white">"Install app"</strong> banner or menu <strong className="text-white">(⋮)</strong>.
                    </li>
                    <li>
                      Select <strong className="text-white">"Install"</strong> or <strong className="text-white">"Add to Home screen"</strong>.
                    </li>
                  </ol>
                </div>

                {/* iPhone Steps */}
                <div className="rounded-2xl bg-slate-950 p-3.5 border border-slate-800 space-y-1.5">
                  <span className="font-bold text-amber-400 text-[11px] flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5" /> On iPhone (Safari):
                  </span>
                  <ol className="text-[11px] text-slate-300 space-y-1 list-decimal list-inside leading-relaxed">
                    <li>Open direct URL in Safari.</li>
                    <li>
                      Tap the <strong className="text-white">Share <Share className="w-3 h-3 inline text-emerald-400" /></strong> icon.
                    </li>
                    <li>
                      Tap <strong className="text-white">"Add to Home Screen" <PlusSquare className="w-3 h-3 inline text-emerald-400" /></strong>.
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Footer Dismiss Button */}
            <button
              onClick={() => setShowModal(false)}
              className="w-full rounded-2xl bg-slate-800 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};
