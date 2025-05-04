// scripts/deploy.js
const fs = require('fs');
const path = require('path');
const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("📦 Deploying contracts with account:", deployer.address);

  // 部署 TenantManagement
  const TenantManagement = await hre.ethers.getContractFactory("TenantManagement");
  const tenant = await TenantManagement.deploy();
  await tenant.waitForDeployment();
  const tenantAddress = await tenant.getAddress();
  console.log("✅ TenantManagement deployed to:", tenantAddress);

  // 部署 AuditLogging
  const AuditLogging = await hre.ethers.getContractFactory("AuditLogging");
  const audit = await AuditLogging.deploy();
  await audit.waitForDeployment();
  const auditAddress = await audit.getAddress();
  console.log("✅ AuditLogging deployed to:", auditAddress);

  // 部署 PolicyExecution（依赖前两个合约地址）
  const PolicyExecution = await hre.ethers.getContractFactory("PolicyExecution");
  const policy = await PolicyExecution.deploy(tenantAddress, auditAddress);

  await policy.waitForDeployment();
  const policyAddress = await policy.getAddress();
  console.log("✅ PolicyExecution deployed to:", policyAddress);

  // 保存地址到 deployments/localhost.json
  const deploymentData = {
    TenantManagement: tenantAddress,
    AuditLogging: auditAddress,
    PolicyExecution: policyAddress
  };

  const filePath = path.join(__dirname, '../deployments/localhost.json');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(deploymentData, null, 2));
  console.log("📝 合约地址已保存到:", filePath);
}

main().catch((error) => {
  console.error("❌ 部署失败:", error);
  process.exit(1);
});
