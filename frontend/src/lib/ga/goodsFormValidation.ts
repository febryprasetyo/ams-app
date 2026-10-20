export interface FormSubmissionRow {
  name: string;
  quantity: string | number;
  estimatedPrice: string | number;
  notes?: string;
  evidenceCount?: number;
}

export interface FormSubmissionData {
  title: string;
  purpose: string;
  identity: {
    requestDate: string;
    requesterName: string;
    jobTitle: string;
    division: string;
  };
  rows: FormSubmissionRow[];
}

export interface FormValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateFormSubmission(
  data: FormSubmissionData,
  isDraft: boolean
): FormValidationResult {
  const errors: string[] = [];

  if (isDraft) {
    return { isValid: true, errors: [] };
  }

  if (!data.title || !data.title.trim()) {
    errors.push('Judul pengajuan wajib diisi.');
  }

  if (!data.identity.requestDate || !data.identity.requestDate.trim()) {
    errors.push('Tanggal pengajuan wajib diisi.');
  }

  if (!data.identity.requesterName || !data.identity.requesterName.trim()) {
    errors.push('Nama pengaju wajib diisi.');
  }

  if (!data.identity.jobTitle || !data.identity.jobTitle.trim()) {
    errors.push('Jabatan pengaju wajib diisi.');
  }

  if (!data.identity.division || !data.identity.division.trim()) {
    errors.push('Divisi pengaju wajib diisi.');
  }

  if (!data.rows || data.rows.length === 0) {
    errors.push('Pengajuan wajib memiliki minimal satu barang.');
  } else {
    data.rows.forEach((row, index) => {
      if (!row.name || !row.name.trim()) {
        errors.push(`Item ${index + 1}: Nama barang wajib diisi.`);
      }
      const qty = Number(row.quantity);
      if (!qty || qty <= 0) {
        errors.push(`Item ${index + 1}: Qty harus lebih dari 0.`);
      }
      const price = Number(row.estimatedPrice);
      if (!price || price <= 0) {
        errors.push(`Item ${index + 1}: Estimasi harga harus lebih dari 0.`);
      }
      if (!row.evidenceCount || row.evidenceCount <= 0) {
        errors.push(`Item ${index + 1}: Lampiran bukti harga wajib ditambahkan.`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
