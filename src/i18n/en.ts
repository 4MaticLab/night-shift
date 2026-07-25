import { englishCatalog } from "./en-catalog";
import { rainRadioEnglish } from "./campaigns/rain-radio.en";
import { thirteenthLoafEnglish } from "./campaigns/thirteenth-loaf.en";
import { chihayaNoaEnglish } from "./campaigns/chihaya-noa.en";
import { fogWithoutWolvesEnglish } from "./campaigns/fog-without-wolves.en";
import { postersEnglish } from "./campaigns/posters.en";
import { englishOverrides } from "./en-overrides";

export const englishText: Record<string, string> = {
  ...englishCatalog,
  ...rainRadioEnglish,
  ...thirteenthLoafEnglish,
  ...chihayaNoaEnglish,
  ...fogWithoutWolvesEnglish,
  ...postersEnglish,
  ...englishOverrides,
};
