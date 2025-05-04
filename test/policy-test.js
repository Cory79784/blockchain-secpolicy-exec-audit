// ✅ 文件：test/policy-test.js
// 使用 Hardhat + Chai 进行自动化测试

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PolicyExecution with AuditLogging", function () {
  let tenantManager, auditLogger, policyExec;
  let owner, tenantA, tenantB;

  beforeEach(async function () {
    [owner, tenantA, tenantB] = await ethers.getSigners();

    const TenantManagement = await ethers.getContractFactory("TenantManagement");
    tenantManager = await TenantManagement.deploy();
    await tenantManager.waitForDeployment();

    const AuditLogging = await ethers.getContractFactory("AuditLogging");
    auditLogger = await AuditLogging.deploy();
    await auditLogger.waitForDeployment();

    const PolicyExecution = await ethers.getContractFactory("PolicyExecution");
    policyExec = await PolicyExecution.deploy(
      await tenantManager.getAddress(),
      await auditLogger.getAddress()
    );
    await policyExec.waitForDeployment();

    await tenantManager.connect(tenantA).registerTenant("Alpha");
    await tenantManager.connect(tenantB).registerTenant("Beta");
  });

  it("should allow multiple tenants to create and execute their own policies", async function () {
    await policyExec.connect(tenantA).createPolicy("PA", "DescA");
    await policyExec.connect(tenantB).createPolicy("PB", "DescB");

    await expect(policyExec.connect(tenantA).executePolicy(0)).to.emit(policyExec, "PolicyExecuted");
    await expect(policyExec.connect(tenantB).executePolicy(1)).to.emit(policyExec, "PolicyExecuted");
  });

  it("should prevent tenants from executing others' policies", async function () {
    await policyExec.connect(tenantA).createPolicy("PA", "DescA");
    await expect(policyExec.connect(tenantB).executePolicy(0)).to.be.revertedWith("Not policy owner");
  });

  it("should record audit logs correctly", async function () {
    await policyExec.connect(tenantA).createPolicy("PA", "DescA");
    await policyExec.connect(tenantA).executePolicy(0);

    const logCount = await auditLogger.getLogCount();
    expect(logCount).to.equal(1);

    const log = await auditLogger.getLog(0);
    expect(log.executor).to.equal(tenantA.address);
    expect(log.policyId).to.equal(0);
    expect(log.success).to.equal(true);
  });
});