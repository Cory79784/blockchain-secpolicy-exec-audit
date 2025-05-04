// scripts/interaction.js

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [signer] = await hre.ethers.getSigners();

  // 读取地址文件
  const addresses = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../deployed-addresses.json"), "utf8")
  );

  const tenantManagement = await hre.ethers.getContractAt("TenantManagement", addresses.TenantManagement, signer);
  const policyExecution = await hre.ethers.getContractAt("PolicyExecution", addresses.PolicyExecution, signer);

  // 添加租户
  console.log("🧾 Registering tenant...");
  const tx1 = await tenantManagement.registerTenant("TenantA");
  await tx1.wait();
  console.log("✅ TenantA registered!");  

  // 检查是否是租户
  const isTenant = await tenantManagement.isTenant(signer.address);
  console.log("🔍 Is current user a tenant?", isTenant);

  // 创建策略（新增 tenantId 和 role 参数）
  console.log("🛡️ Creating policy...");
  const tx2 = await policyExecution.createPolicy("SecurityPolicy", "A sample policy", "TenantA", "admin");
  await tx2.wait();
  console.log("✅ Policy created!");

  // 执行策略
  console.log("🚀 Executing policy ID 0...");
  const tx3 = await policyExecution.executePolicy(0);
  await tx3.wait();
  console.log("✅ Policy executed!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
