'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import ModalShell from '@/components/ui/ModalShell';
import { Printer, Loader2 } from 'lucide-react';
import { AssetDetail } from '@/lib/assets/types';

export interface PrintAssetTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: AssetDetail;
}

export default function PrintAssetTagModal({
  isOpen,
  onClose,
  asset,
}: PrintAssetTagModalProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const qrPayload = `${window.location.origin}/dashboard/assets/${asset.id}`;
      QRCode.toDataURL(qrPayload, {
        width: 300,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error('Failed to generate QR code', err));
    }
  }, [isOpen, asset.id]);

  const handlePrintSticker = () => {
    if (!qrCodeDataUrl) return;

    const printWindow = window.open('', '_blank', 'width=650,height=520');
    if (!printWindow) {
      alert('Please allow popups in your browser to print the asset tag sticker.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Asset Tag QR Sticker - ${asset.assetCode}</title>
          <style>
            @page {
              size: 80mm 50mm;
              margin: 0;
            }
            * {
              box-sizing: border-box;
            }
            body {
              margin: 0;
              padding: 8px;
              font-family: 'Courier New', Courier, monospace;
              background: #ffffff;
              color: #000000;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .tag-card {
              width: 78mm;
              height: 48mm;
              border: 2.5px solid #000000;
              border-radius: 6px;
              padding: 6px 8px;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              background: #ffffff;
            }
            .header {
              font-size: 9px;
              font-weight: bold;
              letter-spacing: 1px;
              border-bottom: 1.5px solid #000000;
              padding-bottom: 3px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              text-transform: uppercase;
            }
            .body-content {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 8px;
              margin: 4px 0;
            }
            .qr-img {
              width: 26mm;
              height: 26mm;
              border: 1px solid #000000;
              padding: 2px;
              background: #ffffff;
            }
            .asset-info {
              flex: 1;
              text-align: left;
            }
            .asset-code {
              font-size: 15px;
              font-weight: 900;
              letter-spacing: 1px;
              margin-bottom: 2px;
            }
            .asset-name {
              font-size: 9.5px;
              font-weight: bold;
              line-height: 1.2;
              word-break: break-word;
            }
            .footer-meta {
              border-top: 1.5px solid #000000;
              padding-top: 3px;
              display: flex;
              justify-content: space-between;
              font-size: 8px;
              font-weight: bold;
            }
            .notice {
              text-align: center;
              font-size: 7px;
              margin-top: 1px;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <div class="tag-card">
            <div class="header">
              <span>ERP CAHAYA ITSM</span>
              <span>PROPERTY TAG</span>
            </div>
            <div class="body-content">
              <img src="${qrCodeDataUrl}" class="qr-img" />
              <div class="asset-info">
                <div class="asset-code">${asset.assetCode}</div>
                <div class="asset-name">${asset.name}</div>
                <div style="font-size: 8px; margin-top: 2px; text-transform: uppercase;">
                  CAT: ${asset.categoryName || 'IT ASSET'}
                </div>
              </div>
            </div>
            <div class="footer-meta">
              <span>S/N: ${asset.serialNumber || 'N/A'}</span>
              <span>LOC: ${asset.locationName || 'HO-JKT'}</span>
            </div>
            <div class="notice">
              SCAN QR FOR DEVICE SPECS • DO NOT REMOVE
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Print Asset Tag QR Label"
      subtitle="Standard 80mm x 50mm thermal sticker tag with scannable QR code"
      icon={<Printer className="w-5 h-5 text-red-600" />}
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4 font-mono">
        <p className="text-xs text-slate-500 font-sans">
          Preview of standard 80mm x 50mm thermal sticker tag. Scan the QR code to open this
          asset catalog item on mobile:
        </p>

        {/* Thermal Label Preview Card */}
        <div className="border-2 border-slate-900 rounded-2xl p-4 bg-white space-y-3 shadow-inner my-4">
          <div className="flex items-center justify-between border-b border-slate-900 pb-1.5 text-[10px] font-bold text-slate-900">
            <span>ERP CAHAYA ITSM</span>
            <span>PROPERTY TAG</span>
          </div>

          <div className="flex items-center justify-between gap-4 py-1">
            {qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt="QR Code"
                className="w-24 h-24 border border-slate-900 p-1 bg-white shrink-0"
              />
            ) : (
              <div className="w-24 h-24 bg-slate-100 border border-slate-900 flex items-center justify-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            )}
            <div className="flex-1 text-left">
              <p className="font-mono font-black text-base text-red-600 tracking-wider">
                {asset.assetCode}
              </p>
              <p className="text-xs font-bold text-slate-900 leading-tight line-clamp-2 mt-0.5">
                {asset.name}
              </p>
              <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">
                CAT: {asset.categoryName || 'IT ASSET'}
              </p>
            </div>
          </div>

          <div className="text-[10px] border-t border-slate-900 pt-1.5 flex justify-between font-bold text-slate-700">
            <span>S/N: {asset.serialNumber || 'N/A'}</span>
            <span>LOC: {asset.locationName || 'HO-JKT'}</span>
          </div>
          <div className="text-[9px] text-slate-500 italic text-center">
            SCAN QR FOR DEVICE SPECS • DO NOT REMOVE
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              handlePrintSticker();
            }}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print QR Sticker Label</span>
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
