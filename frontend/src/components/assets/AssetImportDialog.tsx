'use client';

import React, { useState } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import { api } from '@/lib/api';
import {
  canCommitAssetImport,
  getCustodianResolutionRows,
  type AssetImportPreview,
  type AssetImportCommitResult,
} from '@/lib/assetImport';
import {
  FileSpreadsheet,
  FileUp,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Check,
} from 'lucide-react';

export interface AssetImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssetImportDialog({
  isOpen,
  onClose,
  onSuccess,
}: AssetImportDialogProps) {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<AssetImportPreview | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<AssetImportCommitResult | null>(null);

  const resetState = () => {
    setImportFile(null);
    setImportPreview(null);
    setIsValidating(false);
    setIsCommitting(false);
    setImportError(null);
    setImportSuccess(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportPreview(null);
    setImportError(null);
    setImportSuccess(null);
    setIsValidating(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const previewData = await api.upload<AssetImportPreview>(
        '/assets/import/preview',
        formData
      );
      setImportPreview(previewData);
    } catch (err: any) {
      setImportError(err.message || 'Failed to parse and validate spreadsheet file');
    } finally {
      setIsValidating(false);
    }
  };

  const handleCommitImport = async () => {
    if (!importFile || !importPreview) return;
    setIsCommitting(true);
    setImportError(null);

    try {
      const formData = new FormData();
      formData.append('file', importFile);
      const commitRes = await api.upload<AssetImportCommitResult>(
        '/assets/import/commit',
        formData
      );
      setImportSuccess(commitRes);
      onSuccess();
    } catch (err: any) {
      setImportError(err.message || 'Failed to commit import');
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      isLoading={isValidating || isCommitting}
      title="Bulk Import Assets from XLSX"
      subtitle="Upload standard 4-sheet XLSX workbook to import computers, other hardware, and accessories"
      icon={<FileSpreadsheet className="w-5 h-5 text-emerald-600" />}
      maxWidthClass="max-w-3xl"
    >
      {importSuccess ? (
        <div className="p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <Check className="w-8 h-8" />
          </div>
          <h4 className="text-lg font-extrabold text-slate-900">
            Import Completed Successfully!
          </h4>
          <p className="text-xs text-slate-500 font-mono">
            All devices, hardware specifications, and attached accessories have been written
            into the inventory catalog.
          </p>

          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-mono max-w-md mx-auto">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Computers</span>
              <span className="font-bold text-blue-600 text-base">
                {importSuccess.computersCreated}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Other Devices</span>
              <span className="font-bold text-emerald-600 text-base">
                {importSuccess.otherAssetsCreated}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Accessories</span>
              <span className="font-bold text-purple-600 text-base">
                {importSuccess.accessoriesCreated}
              </span>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Close & View Updated Inventory
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* File Picker Section */}
          <div className="p-6 border-2 border-dashed border-slate-200 hover:border-emerald-500/50 rounded-3xl bg-slate-50/50 text-center transition-colors">
            <FileUp className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
            <p className="text-xs font-bold text-slate-800">
              Select an XLSX Spreadsheet File
            </p>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              Must use the standard 4-sheet template (Petunjuk, Laptop-PC, Other Assets,
              Accessories).
            </p>
            <label className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer shadow-2xs transition-all">
              <span>{importFile ? importFile.name : 'Browse Computer Files...'}</span>
              <input
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Validation Loader */}
          {isValidating && (
            <div className="p-6 text-center text-slate-500 text-xs font-mono flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Parsing and validating Excel sheets...</span>
            </div>
          )}

          {/* Error Message */}
          {importError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{importError}</span>
            </div>
          )}

          {/* Preview Results */}
          {importPreview && !isValidating && (
            <div className="space-y-4">
              {/* Validation Status Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-mono ${
                  importPreview.valid && importPreview.summary.errorCount === 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {importPreview.valid && importPreview.summary.errorCount === 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <div>
                    <p className="font-bold">
                      {importPreview.valid && importPreview.summary.errorCount === 0
                        ? 'Workbook Validation Passed'
                        : `Validation Found ${importPreview.summary.errorCount} Error(s)`}
                    </p>
                    <p className="text-[11px] opacity-80 font-sans">
                      {importPreview.valid && importPreview.summary.errorCount === 0
                        ? importPreview.summary.warningCount > 0
                          ? 'Workbook has minor warnings but is safe to commit.'
                          : 'All rows and references are valid and ready to import.'
                        : 'Please resolve errors in your spreadsheet before committing to inventory.'}
                    </p>
                  </div>
                </div>

                <div className="text-right font-bold text-xs shrink-0">
                  {importPreview.summary.validRows} / {importPreview.summary.totalRows} Rows
                  Valid
                </div>
              </div>

              {/* Summary Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase">Computers</span>
                  <span className="font-bold text-slate-800">
                    {importPreview.summary.laptopPcCount}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase">
                    Other Devices
                  </span>
                  <span className="font-bold text-slate-800">
                    {importPreview.summary.otherAssetCount}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase">
                    Accessories
                  </span>
                  <span className="font-bold text-slate-800">
                    {importPreview.summary.accessoryCount}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase">Issues</span>
                  <span className="font-bold text-slate-800">
                    {importPreview.summary.errorCount} err /{' '}
                    {importPreview.summary.warningCount} warn
                  </span>
                </div>
              </div>

              {/* Holder Resolution Decisions */}
              {getCustodianResolutionRows(importPreview).length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono font-bold text-slate-700 uppercase block">
                    Holder Resolution Decisions
                  </span>
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs">
                    {getCustodianResolutionRows(importPreview).map((row) => (
                      <div
                        key={`${row.source}-${row.rowNumber}`}
                        className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-2.5"
                      >
                        <span className="text-[10px] font-mono text-slate-400">
                          {row.source} #{row.rowNumber}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-bold text-slate-800">
                            {row.assetName}
                          </span>
                          <span className="block truncate text-[10px] text-slate-500">
                            {row.holderName || 'No holder'}
                          </span>
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[9px] font-mono font-bold ${
                            row.action === 'ERROR'
                              ? 'border-rose-200 bg-rose-50 text-rose-700'
                              : row.action === 'UNASSIGNED'
                              ? 'border-slate-200 bg-slate-50 text-slate-600'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {row.action.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error / Warning Table */}
              {importPreview.messages.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono font-bold text-slate-700 uppercase block">
                    Validation Messages ({importPreview.messages.length})
                  </span>
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs font-mono">
                    {importPreview.messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 flex items-start gap-2.5 ${
                          msg.type === 'error' ? 'bg-rose-50/50' : 'bg-amber-50/50'
                        }`}
                      >
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            msg.type === 'error'
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-500 text-white'
                          }`}
                        >
                          {msg.type}
                        </span>
                        <div className="flex-1">
                          <span className="font-bold text-slate-900">
                            [{msg.sheet}] Row {msg.rowNumber}
                            {msg.field ? ` • ${msg.field}` : ''}:
                          </span>{' '}
                          <span className="text-slate-700 font-sans text-[11px]">
                            {msg.message}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Commit Action */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCommitImport}
                  disabled={!canCommitAssetImport(importPreview, isCommitting)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  {isCommitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Commit Import to Inventory</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </ModalShell>
  );
}
