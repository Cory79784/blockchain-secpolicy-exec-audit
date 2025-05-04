const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const [admin] = await hre.ethers.getSigners();
  const deploymentData = require("../deployments/localhost.json");
  const accountsData = require("./accountRegister.json");

  const TenantManagement = await hre.ethers.getContractFactory("TenantManagement");
  const tenantContract = TenantManagement.attach(deploymentData.TenantManagement);

  // 注册 Cloud Admin
  for (const user of accountsData.cloudAdmins) {
    try {
      const tx = await tenantContract.connect(admin).registerTenant(
        user.tenantId,
        "tenant", // role 固定
        "type2",  // Cloud Admin 是 type2
        ""
      );
      await tx.wait();
      console.log(`✅ Registered Cloud Admin: ${user.tenantId}`);
    } catch (err) {
      console.warn(`⚠️  Failed to register Cloud Admin ${user.tenantId}: ${err.message}`);
    }
  }

  // 注册 Network Admin
  for (const user of accountsData.networkAdmins) {
    try {
      const tx = await tenantContract.connect(admin).registerTenant(
        user.tenantId,
        "tenant",
        "type1",         // Network Admin 是 type1
        "Network Admin"
      );
      await tx.wait();
      console.log(`✅ Registered Network Admin: ${user.tenantId}`);
    } catch (err) {
      console.warn(`⚠️  Failed to register Network Admin ${user.tenantId}: ${err.message}`);
    }
  }

  console.log("✅ 所有固定租户注册完毕。");
}

main().catch((err) => {
  console.error("❌ Script failed:", err);
  process.exit(1);
});
