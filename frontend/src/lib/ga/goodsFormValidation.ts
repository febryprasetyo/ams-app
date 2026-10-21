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
  } else {
    const value = data.identity.requestDate;
    const parsed = new Date(value + 'T00:00:00Z');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
      errors.push('Tanggal pengajuan tidak valid.');
    }
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
    if (data.rows.length > 20) errors.push('Maksimal 20 item per pengajuan.');
    data.rows.forEach((row, index) => {
      if (!row.name || !row.name.trim()) {
        errors.push(`Item ${index + 1}: Nama barang wajib diisi.`);
      }
      const qty = Number(row.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > 1000000) {
        errors.push(`Item ${index + 1}: Qty harus bilangan bulat antara 1 dan 1.000.000.`);
      }
      const price = Number(row.estimatedPrice);
      if (!Number.isInteger(price) || price < 1 || price > 100000000000) {
        errors.push(`Item ${index + 1}: Estimasi harga harus bilangan bulat antara Rp1 dan Rp100.000.000.000.`);
      }
      const subtotal = qty * price;
      if (!Number.isSafeInteger(subtotal) || subtotal > 99999999999999) {
        errors.push(`Item ${index + 1}: Subtotal melebihi batas yang dapat disimpan.`);
      }
      if ((row.evidenceCount ?? 0) > 3) {
        errors.push(`Item ${index + 1}: Maksimal 3 gambar bukti harga.`);
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
