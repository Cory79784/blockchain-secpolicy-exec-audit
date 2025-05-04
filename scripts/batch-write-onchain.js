// scripts/batch-write-onchain.js
/*
const fs = require('fs');
const csv = require('csv-parser');
const hre = require('hardhat');

async function main() {
  const [signer] = await hre.ethers.getSigners();

  // 替换为你的合约名和地址
  const AuditLogging = await hre.ethers.getContractFactory("AuditLogging");
  const auditContract = await AuditLogging.attach("0x4c0883a69102937d623414fecadf32e0d6e3456d982b1e34f4db6b45ae3e0fd6");

  const results = [];

  fs.createReadStream('./data/onchain_data.csv')
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      for (let i = 0; i < results.length; i++) {
        const row = results[i];
        try {
          const tx = await auditContract.logEvent(
            row.tenantID,
            row.userID,
            row.tenant_role,
            row.action_type,
            row.policy_version,
            row.security_alert.toLowerCase() === "true", // 转换为布尔值
            row.response_action,
            row.event_id,
            row.timestamp,
            row.hash_on_blockchain,
            row.severity_level
          );
          await tx.wait();
          console.log(`✅ 写入第 ${i + 1} 条成功: ${row.hash_on_blockchain}`);
        } catch (err) {
          console.error(`❌ 第 ${i + 1} 条失败:`, err.message);
        }
      }
      console.log("🎉 所有数据已处理完毕！");
    });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
*/



// scripts/simulate-policy-execution.js
const fs = require('fs');
const csv = require('csv-parser');
const hre = require('hardhat');

async function main() {
  const [signer] = await hre.ethers.getSigners();

  // 替换为你的合约地址
  const policyExecution = await hre.ethers.getContractFactory("PolicyExecution");
  const policyContract = await policyExecution.attach("0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0");

  const results = [];

  fs.createReadStream('./data_simulation/On-chain_Data.csv')
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      for (let i = 0; i < results.length; i++) {
        const row = results[i];

        // 为每行数据创建策略
        const name = `${row.action_type}-${i}`;
        const desc = `Tenant: ${row.tenantID}, User: ${row.userID}`;
        try {
          const createTx = await policyContract.createPolicy(name, desc);
          await createTx.wait();

          // 默认策略 ID 就是当前索引（如果按顺序创建）
          const execTx = await policyContract.executePolicy(i);
          await execTx.wait();

          console.log(`✅ 第 ${i + 1} 条策略创建并执行成功`);
        } catch (err) {
          console.error(`❌ 第 ${i + 1} 条失败:`, err.message);
        }
      }

      console.log("✅ 所有策略处理完毕！");
    });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
