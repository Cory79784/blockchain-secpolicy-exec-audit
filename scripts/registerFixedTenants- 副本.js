// scripts/verify-logs.js
/*
const fs = require('fs');
const path = require('path');
const { ethers } = require('hardhat');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// 自动读取合约地址
const deploymentPath = path.join(__dirname, '../deployments/localhost.json');
const addresses = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));

async function main() {
  const AuditLogging = await ethers.getContractFactory("AuditLogging");
  const audit = await AuditLogging.attach(addresses.AuditLogging);

  const logCount = await audit.getLogCount();
  console.log(`📊 共找到 ${logCount} 条链上日志`);

  const logs = [];

  for (let i = 0; i < logCount; i++) {
    const log = await audit.getLog(i);
    logs.push({
      index: i,
      executor: log.executor,
      policyId: log.policyId.toString(),
      timestamp: new Date(Number(log.timestamp) * 1000).toISOString(),
      success: log.success,
      tenantId: log.tenantId,
      role: log.role
    });
  }

  // 写入 CSV
  const outputPath = path.join(__dirname, '../data_simulation/audit_logs_detailed.csv');
  const csvWriter = createCsvWriter({
    path: outputPath,
    header: [
      { id: 'index', title: 'Index' },
      { id: 'executor', title: 'Executor' },
      { id: 'policyId', title: 'Policy ID' },
      { id: 'timestamp', title: 'Timestamp' },
      { id: 'success', title: 'Success' },
      { id: 'tenantId', title: 'Tenant ID' },
      { id: 'role', title: 'Role' }
    ]
  });

  await csvWriter.writeRecords(logs);
  console.log(`✅ 审计日志已导出至: ${outputPath}`);
}

main().catch((err) => {
  console.error("❌ 日志导出失败:", err);
  process.exit(1);
});
*/


// scripts/verify-logs-rbac.js

const fs = require('fs');
const path = require('path');
const { ethers } = require('hardhat');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// 自动读取合约地址
const deploymentPath = path.join(__dirname, '../deployed-addresses.json');
const addresses = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));

async function main() {
  const AuditLogging = await ethers.getContractFactory("AuditLogging");
  const audit = await AuditLogging.attach(addresses.AuditLogging);

  const signers = await ethers.getSigners();

  // 注册所有用户上下文信息
  const userContexts = [
    { signerIndex: 0, tenantId: "AdminOrg", role: "admin" },
    { signerIndex: 1, tenantId: "TenantA", role: "user" },
    { signerIndex: 2, tenantId: "TenantA", role: "admin" },
    { signerIndex: 3, tenantId: "TenantB", role: "manager" },
    { signerIndex: 4, tenantId: "TenantB", role: "user" },
    { signerIndex: 5, tenantId: "TenantA", role: "user" }
  ];

  for (const { signerIndex, tenantId, role } of userContexts) {
    const signer = signers[signerIndex];
    try {
      await audit.connect(signer).registerUserContext(signer.address, tenantId, role);
      console.log(`✅ 注册上下文: ${signer.address} -> ${tenantId}, ${role}`);
    } catch (err) {
      console.log(`❌ 注册失败: ${err.message}`);
    }
  }

  const viewer = signers[2]; // 当前查看者：TenantA 的 admin
  const total = await audit.connect(viewer).getLogCount();
  const logs = [];

  for (let i = 0; i < total; i++) {
    try {
      const log = await audit.connect(viewer).getLog(i);
      logs.push({
        index: i,
        executor: log.executor,
        policyId: log.policyId.toString(),
        timestamp: new Date(Number(log.timestamp) * 1000).toISOString(),
        success: log.success,
        tenantId: log.tenantId,
        role: log.role
      });
    } catch (err) {
      console.log(`⛔ 跳过第 ${i} 条日志（无权限）`);
    }
  }

  const outputPath = path.join(__dirname, '../data_simulation/audit_logs_rbac.csv');
  const csvWriter = createCsvWriter({
    path: outputPath,
    header: [
      { id: 'index', title: 'Index' },
      { id: 'executor', title: 'Executor' },
      { id: 'policyId', title: 'Policy ID' },
      { id: 'timestamp', title: 'Timestamp' },
      { id: 'success', title: 'Success' },
      { id: 'tenantId', title: 'Tenant ID' },
      { id: 'role', title: 'Role' }
    ]
  });

  await csvWriter.writeRecords(logs);
  console.log(`📄 已导出可访问的审计日志 (${logs.length} 条) 至: ${outputPath}`);
}

main().catch((err) => {
  console.error("❌ 日志导出失败:", err);
  process.exit(1);
});
