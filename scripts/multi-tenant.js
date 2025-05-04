const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [admin, tenant1, tenant2, tenant3] = await hre.ethers.getSigners();

  const addresses = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../deployed-addresses.json"), "utf8")
  );

  const tenantMgmt = await hre.ethers.getContractAt("TenantManagement", addresses.TenantManagement, tenant1);
  const policyExec = await hre.ethers.getContractAt("PolicyExecution", addresses.PolicyExecution, tenant1);

  console.log("➡️ Registering 3 tenants...");
  await (await tenantMgmt.connect(tenant1).registerTenant("Company1")).wait();
  await (await tenantMgmt.connect(tenant2).registerTenant("Company2")).wait();
  await (await tenantMgmt.connect(tenant3).registerTenant("Company3")).wait();

  console.log("✅ Tenants registered");

  console.log("➡️ Creating policies for each tenant...");
  await (await policyExec.connect(tenant1).createPolicy("Policy1", "For Company1")).wait();
  await (await policyExec.connect(tenant2).createPolicy("Policy2", "For Company2")).wait();
  await (await policyExec.connect(tenant3).createPolicy("Policy3", "For Company3")).wait();

  console.log("✅ Policies created");

  console.log("➡️ Executing each policy...");
  await (await policyExec.connect(tenant1).executePolicy(0)).wait();
  await (await policyExec.connect(tenant2).executePolicy(1)).wait();
  await (await policyExec.connect(tenant3).executePolicy(2)).wait();

  console.log("✅ All policies executed successfully");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
