// 渲染进程的全局类型：preload 注入的 window.nightPet。
// 仅类型声明，不产出运行时代码。

import type { NightPetBridge } from "../shared/contracts";

declare global {
  interface Window {
    nightPet: NightPetBridge;
  }
}

export {};
