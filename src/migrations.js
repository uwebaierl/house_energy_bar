import { createRemovePathsCleanup } from "./_shared/config-cleanup.js";
import { migrateLegacyColorConfig } from "./_shared/legacy-config.js";

export const HOUSE_CONFIG_CLEANUP_STEPS = [
  createRemovePathsCleanup(["segment_tokens"]),
  migrateLegacyHouseEnergyColors,
];

export const HOUSE_EDITOR_CLEANUP_STEPS = [
  createRemovePathsCleanup(["segment_tokens"]),
  migrateLegacyHouseEnergyColors,
];

export function migrateLegacyHouseEnergyColors(config) {
  return migrateLegacyColorConfig(config, {
    grid_import: "segment1",
    energy_storage_supply: "segment2",
    grid_export: "segment3",
  });
}
