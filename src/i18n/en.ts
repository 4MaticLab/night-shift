import { englishCatalog } from "./en-catalog";
import { rainRadioEnglish } from "./campaigns/rain-radio.en";
import { englishOverrides } from "./en-overrides";

export const englishText: Record<string, string> = {
  ...englishCatalog,
  ...rainRadioEnglish,
  ...englishOverrides,
};
