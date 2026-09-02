export interface AssetAccessoryFormItem {
  id?: number;
  accessoryType: string;
  description?: string;
  quantity: number | '';
  condition: string;
  notes?: string;
}

export interface AssetFormValues {
  assetName: string;
  equipmentTypeId: number | '';
  isEditing: boolean;
  equipmentTypesAvailable: boolean;
  isComputerType?: boolean;
  cpuName?: string;
  ramSizeGb?: number | '';
  ramSlotCount?: number | '';
  disk1SizeGb?: number | '';
  disk2SizeGb?: number | '';
  accessories?: AssetAccessoryFormItem[];
}

export function isComputerCategoryName(name?: string | null): boolean {
  if (!name) return false;
  const normalized = name.trim().toLowerCase();
  return (
    normalized === 'laptop' ||
    normalized === 'pc' ||
    normalized === 'desktop' ||
    normalized === 'desktop pc' ||
    normalized === 'pc desktop' ||
    normalized === 'notebook' ||
    normalized === 'workstation' ||
    normalized === 'personal computer' ||
    normalized === 'computer' ||
    normalized.includes('laptop') ||
    normalized.includes('desktop') ||
    normalized.includes('notebook') ||
    /\b(pc|computer|workstation)\b/i.test(normalized)
  );
}

export function canSubmitAssetForm(input: AssetFormValues): boolean {
  if (!input.assetName.trim() || !input.equipmentTypeId) return false;
  if (!input.isEditing && !input.equipmentTypesAvailable) return false;

  if (input.isComputerType) {
    if (!input.cpuName || !input.cpuName.trim()) return false;
    if (input.ramSizeGb === undefined || input.ramSizeGb === '' || Number(input.ramSizeGb) <= 0) return false;
    if (input.ramSlotCount === undefined || input.ramSlotCount === '' || Number(input.ramSlotCount) <= 0) return false;
    if (input.disk1SizeGb === undefined || input.disk1SizeGb === '' || Number(input.disk1SizeGb) <= 0) return false;
    if (input.disk2SizeGb !== undefined && input.disk2SizeGb !== '' && Number(input.disk2SizeGb) <= 0) return false;

    if (input.accessories && input.accessories.length > 0) {
      for (const acc of input.accessories) {
        if (!acc.accessoryType.trim()) return false;
        if (acc.quantity === undefined || acc.quantity === '' || Number(acc.quantity) <= 0) return false;
        if (!['Good', 'Fair', 'Poor', 'Damaged'].includes(acc.condition)) return false;
      }
    }
  }

  return true;
}
