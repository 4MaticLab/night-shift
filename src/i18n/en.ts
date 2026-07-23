import { englishCatalog } from "./en-catalog";
import { englishOverrides } from "./en-overrides";

export const englishText: Record<string, string> = {
  ...englishCatalog,
  ...englishOverrides,
};
