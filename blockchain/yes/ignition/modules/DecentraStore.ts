import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DecentraStoreModule = buildModule("DecentraStoreModule", (m) => {
  const decentrastore = m.contract("DecentraStore");

  return { decentrastore };
});

export default DecentraStoreModule;