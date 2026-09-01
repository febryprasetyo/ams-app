import {
  isComputerEquipmentType,
  type ComputerSpecsInput,
  type AccessoryInput,
} from '../domain/assetDetails';

export interface AssetDetailsRepository {
  deleteComputerSpecs(assetId: number): Promise<void>;
  deleteAccessories(assetId: number): Promise<void>;
  insertComputerSpecs(value: ComputerSpecsInput & { assetId: number }): Promise<void>;
  insertAccessories(values: Array<AccessoryInput & { assetId: number }>): Promise<void>;
}

export interface ReplaceAssetDetailsInput {
  assetId: number;
  categoryName: string;
  computerSpecs?: ComputerSpecsInput | null;
  accessories?: AccessoryInput[];
}

export async function replaceAssetDetails(
  repository: AssetDetailsRepository,
  input: ReplaceAssetDetailsInput,
): Promise<void> {
  const computer = isComputerEquipmentType(input.categoryName);
  const accessories = input.accessories ?? [];

  if (!computer && (input.computerSpecs || accessories.length > 0)) {
    throw new Error('Computer specifications and accessories require a Laptop or PC category');
  }

  if (computer && !input.computerSpecs) {
    throw new Error('Computer specifications are required for Laptop or PC');
  }

  await repository.deleteComputerSpecs(input.assetId);
  await repository.deleteAccessories(input.assetId);

  if (!computer) return;

  await repository.insertComputerSpecs({
    assetId: input.assetId,
    ...input.computerSpecs!,
  });

  if (accessories.length > 0) {
    await repository.insertAccessories(
      accessories.map((item) => ({
        assetId: input.assetId,
        ...item,
      })),
   );
  }
}
