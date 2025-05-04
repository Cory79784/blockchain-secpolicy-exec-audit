// ✅ 文件：scripts/perf-metrics.js
// 功能：测量策略创建和执行的 gas 消耗和耗时（正确权限账户执行）
/*
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [admin, tenant] = await hre.ethers.getSigners();

  const addresses = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../deployed-addresses.json"), "utf8")
  );

  const tenantMgmt = await hre.ethers.getContractAt("TenantManagement", addresses.TenantManagement, tenant);
  const policyExec = await hre.ethers.getContractAt("PolicyExecution", addresses.PolicyExecution, tenant);

  // ✅ 注册租户
  await (await tenantMgmt.connect(tenant).registerTenant("PerfTenant")).wait();

  // ✅ 创建策略
  const startCreate = Date.now();
  const txCreate = await policyExec.connect(tenant).createPolicy("PerfTest", "Testing gas usage");
  const receiptCreate = await txCreate.wait();
  const endCreate = Date.now();

  console.log("🚀 Create Policy");
  console.log("Gas Used:", receiptCreate.gasUsed.toString());
  console.log("Time Elapsed:", endCreate - startCreate, "ms\n");

  // ✅ 执行策略（由策略 owner 执行）
  const startExec = Date.now();
  const txExec = await policyExec.connect(tenant).executePolicy(0);
  const receiptExec = await txExec.wait();
  const endExec = Date.now();

  console.log("⚡ Execute Policy");
  console.log("Gas Used:", receiptExec.gasUsed.toString());
  console.log("Time Elapsed:", endExec - startExec, "ms");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
*/




// ✅ 文件：scripts/perf-metrics.js
// 功能：测量策略创建和执行的 gas 消耗和耗时

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [admin, tenant] = await hre.ethers.getSigners();

  const addresses = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../deployed-addresses.json"), "utf8")
  );

  const tenantMgmt = await hre.ethers.getContractAt("TenantManagement", addresses.TenantManagement, tenant);
  const policyExec = await hre.ethers.getContractAt("PolicyExecution", addresses.PolicyExecution, tenant);

  // ✅ 注册前检查是否已注册
  const isRegistered = await tenantMgmt.isTenant(tenant.address);
  if (!isRegistered) {
    console.log("🟢 Registering PerfTenant...");
    await (await tenantMgmt.connect(tenant).registerTenant("PerfTenant")).wait();
  } else {
    console.log("🟡 Tenant already registered, skipping registration.");
  }

  // ✅ 创建策略
  const startCreate = Date.now();
  const txCreate = await policyExec.connect(tenant).createPolicy("PerfTest", "Testing gas usage");
  const receiptCreate = await txCreate.wait();
  const endCreate = Date.now();

  console.log("🚀 Create Policy");
  console.log("Gas Used:", receiptCreate.gasUsed.toString());
  console.log("Time Elapsed:", endCreate - startCreate, "ms\n");

  // ✅ 执行策略（由策略 owner 执行）
  const startExec = Date.now();
  const txExec = await policyExec.connect(tenant).executePolicy(0);
  const receiptExec = await txExec.wait();
  const endExec = Date.now();

  console.log("⚡ Execute Policy");
  console.log("Gas Used:", receiptExec.gasUsed.toString());
  console.log("Time Elapsed:", endExec - startExec, "ms");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
