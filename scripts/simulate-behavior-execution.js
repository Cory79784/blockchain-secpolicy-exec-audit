// scripts/simulate-behavior-execution.js

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// ✅ 策略绑定表（每个行为类型绑定一个策略ID）
// 在真实系统中应该从配置或数据库加载
const behaviorPolicyMap = {
  "upload_file": 0,
  "delete_file": 1,
  "modify_config": 2
};

// ✅ 每个行为由谁执行（模拟用户行为）
const behaviorSimulationData = [
  { behavior: "upload_file", userIndex: 1, tenantId: "TenantA", role: "user" },
  { behavior: "delete_file", userIndex: 2, tenantId: "TenantA", role: "admin" },
  { behavior: "modify_config", userIndex: 3, tenantId: "TenantB", role: "manager" },
  { behavior: "upload_file", userIndex: 4, tenantId: "TenantB", role: "user" },
  { behavior: "delete_file", userIndex: 5, tenantId: "TenantA", role: "user" } // ❌ 非 admin，预期失败
];

async function main() {
  const signers = await hre.ethers.getSigners();
  const addresses = JSON.parse(fs.readFileSync(path.join(__dirname, "../deployed-addresses.json"), "utf8"));

  const tenantMgmt = await hre.ethers.getContractAt("TenantManagement", addresses.TenantManagement);
  const policyExec = await hre.ethers.getContractAt("PolicyExecution", addresses.PolicyExecution);

  // ✅ 先注册所有用户为租户
  for (const { userIndex, tenantId } of behaviorSimulationData) {
    const user = signers[userIndex];
    try {
      await tenantMgmt.connect(user).registerTenant(tenantId,role);
      console.log(`✅ 注册成功: ${user.address} as ${tenantId}`);
    } catch (err) {
      console.log(`⚠️ 注册失败: ${user.address} 可能已注册`);
    }
  }

  // ✅ 由 admin 创建 3 个策略
  const admin = signers[0];
  try {
    await tenantMgmt.connect(admin).registerTenant("AdminOrg");
  } catch (_) {}

  const policies = [
    { name: "UploadPolicy", description: "Policy for uploading files", tenantId: "AdminOrg", role: "admin" },
    { name: "DeletePolicy", description: "Policy for deleting files", tenantId: "AdminOrg", role: "admin" },
    { name: "ConfigPolicy", description: "Policy for modifying config", tenantId: "AdminOrg", role: "admin" }
  ];

  for (const p of policies) {
    await policyExec.connect(admin).createPolicy(p.name, p.description, p.tenantId, p.role);
    console.log(`✅ 策略已创建: ${p.name}`);
  }

  // ✅ 模拟行为驱动的执行
  for (const entry of behaviorSimulationData) {
    const signer = signers[entry.userIndex];
    const policyId = behaviorPolicyMap[entry.behavior];
    try {
      const tx = await policyExec.connect(signer).executePolicy(policyId);
      await tx.wait();
      console.log(`✅ 用户 ${signer.address} 执行行为 ${entry.behavior} 成功`);
    } catch (err) {
      console.log(`❌ 用户 ${signer.address} 执行行为 ${entry.behavior} 失败: ${err.message}`);
    }
  }

  console.log("🎉 行为模拟结束");
}

main().catch((err) => {
  console.error("❌ 脚本执行失败:", err);
  process.exit(1);
});
