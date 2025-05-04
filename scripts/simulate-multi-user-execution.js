// scripts/simulate-multi-user-execution.js

const fs = require('fs');
const csv = require('csv-parser');
const hre = require('hardhat');
const path = require('path');

// ✅ 自动读取部署后的合约地址
const deploymentPath = path.join(__dirname, '../deployments/localhost.json');
const addresses = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));

async function main() {
  const signers = await hre.ethers.getSigners();

  // ✅ 获取合约实例（自动读取地址）
  const tenantManager = await hre.ethers.getContractFactory("TenantManagement");
  const tenantContract = await tenantManager.attach(addresses.TenantManagement);

  const policyExecution = await hre.ethers.getContractFactory("PolicyExecution");
  const policyContract = await policyExecution.attach(addresses.PolicyExecution);

  const results = [];

  // ✅ 预注册 signer（固定 20 个 signer 循环使用）
  for (let i = 0; i < signers.length; i++) {
    try {
      await tenantContract.connect(signers[i]).registerTenant(signers[i].address);
      console.log(`✅ 预注册 signer[${i}]: ${signers[i].address}`);
    } catch (err) {
      console.log(`⚠️ signer[${i}] 注册失败（可能已注册）`);
    }
  }

  // ✅ 读取 CSV 文件并按顺序执行
  fs.createReadStream('./data_simulation/On-chain_Data.csv')
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      console.log(`📦 总数据行数: ${results.length}`);

      for (let i = 0; i < results.length; i++) {
        const row = results[i];
        const signer = signers[i % signers.length]; // ⚠️ 保证创建者和执行者是同一个

        const name = `${row.action_type}-${i}`;
        const desc = `Tenant: ${row.tenantID}, User: ${row.userID}`;
        const tenantId = row.tenantID;
        const role = row.tenant_role;

        try {
          const createTx = await policyContract.connect(signer).createPolicy(name, desc, tenantId, role);
          await createTx.wait();

          const execTx = await policyContract.connect(signer).executePolicy(i);
          await execTx.wait();

          console.log(`✅ 第 ${i + 1} 条策略由 ${signer.address} 执行成功`);
        } catch (err) {
          console.error(`❌ 第 ${i + 1} 条失败: ${err.message}`);
        }
      }

      console.log("🎉 所有策略处理完毕！");
    });
}

main().catch((err) => {
  console.error("❌ 脚本执行失败:", err);
  process.exit(1);
});
