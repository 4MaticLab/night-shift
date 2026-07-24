import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { configVariable, defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  paths: {
    tests: {
      nodejs: "./contract-tests",
      solidity: "./contracts",
    },
  },
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    injectiveTestnet: {
      type: "http",
      chainType: "l1",
      chainId: 1439,
      url: process.env.INJECTIVE_EVM_RPC_URL ?? "https://k8s.testnet.json-rpc.injective.network/",
      accounts: [configVariable("INJECTIVE_DEPLOYER_PRIVATE_KEY")],
    },
  },
});
