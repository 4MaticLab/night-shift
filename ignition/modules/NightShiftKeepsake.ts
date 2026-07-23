import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("NightShiftKeepsakeModule", (module) => {
  const owner = module.getAccount(0);
  const claimSigner = module.getParameter("claimSigner", owner);
  const keepsake = module.contract("NightShiftKeepsake", [owner, claimSigner]);

  return { keepsake };
});
