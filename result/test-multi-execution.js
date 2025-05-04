require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const csv = require('csv-parser');

// 加载合约 ABI 和地址
const policyExecutionAbi = [
    'function createPolicy(string _name, string _content, string _tenantId) public',
    'function executePolicy(uint256 _policyId) public',
    'function policies(uint256) public view returns (uint256 policyId, string policyName, string policyContent, string tenantId, address creator, bool executed)',
    'function restrictedAction(uint256 _actionId) public'
];

const tenantManagementAbi = [
    'function registerTenant(string _tenantId, string _role, string _type, string _level) public',
    'function isTenant(address _tenant) public view returns (bool)',
    'function getTenantInfo(address _tenant) public view returns (string, string, string, string)'
];

const policyExecutionAddress = process.env.POLICY_CONTRACT_ADDRESS;
const tenantManagementAddress = process.env.TENANT_CONTRACT_ADDRESS;

// CSV 数据缓存
let csvData = [];

// 读取 CSV 文件
async function loadCsvData() {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(path.join(__dirname, '../data_simulation/On-chain_Data_Updated.csv'))
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                csvData = results;
                resolve(results);
            })
            .on('error', reject);
    });
}

const accounts = [
    // Type2 Cloud Admins (前10个)
    { tenantId: "tenant_0", address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", type: "type2", role: "admin", level: "Cloud Admin" },
    { tenantId: "tenant_1", address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", type: "type2", role: "admin", level: "Cloud Admin" },
    { tenantId: "tenant_2", address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", privateKey: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", type: "type2", role: "admin", level: "Cloud Admin" },
    { tenantId: "tenant_3", address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", privateKey: "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6", type: "type2", role: "admin", level: "Cloud Admin" },
    { tenantId: "tenant_4", address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", privateKey: "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a", type: "type2", role: "admin", level: "Cloud Admin" },
    { tenantId: "tenant_5", address: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc", privateKey: "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba", type: "type2", role: "admin", level: "Cloud Admin" },
    { tenantId: "tenant_6", address: "0x976EA74026E726554dB657fA54763abd0C3a0aa9", privateKey: "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e", type: "type2", role: "admin", level: "Cloud Admin" },
    { tenantId: "tenant_7", address: "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955", privateKey: "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356", type: "type2", role: "admin", level: "Cloud Admin" },
    { tenantId: "tenant_8", address: "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f", privateKey: "0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97", type: "type2", role: "admin", level: "Cloud Admin" },
    { tenantId: "tenant_9", address: "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720", privateKey: "0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6", type: "type2", role: "admin", level: "Cloud Admin" },

    // Network Admins (后10个)
    { tenantId: "tenant_149", address: "0xBcd4042DE499D14e55001CcbB24a551F3b954096", privateKey: "0xf214f2b2cd398c806f84e317254e0f0b801d0643303237d97a22a48e01628897", type: "type1", role: "admin", level: "Network Admin" },
    { tenantId: "tenant_150", address: "0x71bE63f3384f5fb98995898A86B02Fb2426c5788", privateKey: "0x701b615bbdfb9de65240bc28bd21bbc0d996645a3dd57e7b12bc2bdf6f192c82", type: "type1", role: "admin", level: "Network Admin" },
    { tenantId: "tenant_151", address: "0xFABB0ac9d68B0B445fB7357272Ff202C5651694a", privateKey: "0xa267530f49f8280200edf313ee7af6b827f2a8bce2897751d06a843f644967b1", type: "type1", role: "admin", level: "Network Admin" },
    { tenantId: "tenant_152", address: "0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec", privateKey: "0x47c99abed3324a2707c28affff1267e45918ec8c3f20b8aa892e8b065d2942dd", type: "type1", role: "admin", level: "Network Admin" },
    { tenantId: "tenant_153", address: "0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097", privateKey: "0xc526ee95bf44d8fc405a158bb884d9d1238d99f0612e9f33d006bb0789009aaa", type: "type1", role: "admin", level: "Network Admin" },
    { tenantId: "tenant_154", address: "0xcd3B766CCDd6AE721141F452C550Ca635964ce71", privateKey: "0x8166f546bab6da521a8369cab06c5d2b9e46670292d85c875ee9ec20e84ffb61", type: "type1", role: "admin", level: "Network Admin" },
    { tenantId: "tenant_155", address: "0x2546BcD3c84621e976D8185a91A922aE77ECEc30", privateKey: "0xea6c44ac03bff858b476bba40716402b03e41b8e97e276d1baec7c37d42484a0", type: "type1", role: "admin", level: "Network Admin" },
    { tenantId: "tenant_156", address: "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E", privateKey: "0x689af8efa8c651a91ad287602527f3af2fe9f6501a7ac4b061667b5a93e037fd", type: "type1", role: "admin", level: "Network Admin" },
    { tenantId: "tenant_157", address: "0xdD2FD4581271e230360230F9337D5c0430Bf44C0", privateKey: "0xde9be858da4a475276426320d5e9262ecfc3ba460bfac56360bfa6c4c28b4ee0", type: "type1", role: "admin", level: "Network Admin" },
    { tenantId: "tenant_158", address: "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199", privateKey: "0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e", type: "type1", role: "admin", level: "Network Admin" }
]


async function main() {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const policyContract = new ethers.Contract(policyExecutionAddress, policyExecutionAbi, provider);
    const tenantContract = new ethers.Contract(tenantManagementAddress, tenantManagementAbi, provider);

    // 加载 CSV 数据
    console.log("=== 📊 Loading CSV data ===");
    await loadCsvData();
    console.log(`Loaded ${csvData.length} records from CSV`);

    // Step 1: 注册租户
    console.log("\n=== 🧾 Registering tenants ===");
    for (const acc of accounts) {
        const wallet = new ethers.Wallet(acc.privateKey, provider);
        const signerTenant = tenantContract.connect(wallet);

        try {
            const tx = await signerTenant.registerTenant(
                acc.tenantId,
                acc.role,
                acc.type,
                acc.level
            );
            await tx.wait();
            console.log(`✅ ${acc.tenantId} (${acc.type}, ${acc.level}) registered`);
        } catch (err) {
            console.log(`⚠️ ${acc.tenantId} registration failed: ${err.reason || err.message}`);
        }
    }

    // Step 2: 创建测试策略
    console.log("\n=== 📝 Creating test policy ===");
    const adminWallet = new ethers.Wallet(accounts[0].privateKey, provider);
    const adminContract = policyContract.connect(adminWallet);
    try {
        const tx = await adminContract.createPolicy("Test Policy", "Test Content", accounts[0].tenantId);
        await tx.wait();
        console.log("✅ Test policy created");
    } catch (err) {
        console.log(`❌ Failed to create test policy: ${err.reason || err.message}`);
        return;
    }

    // Step 3: 测试策略执行和违规行为
    console.log("\n=== 🚀 Testing policy execution and blocked behaviors ===");
    const results = [];

    for (const acc of accounts) {
        const wallet = new ethers.Wallet(acc.privateKey, provider);
        const signerContract = policyContract.connect(wallet);

        // 只允许 type2 用户执行成功
        if (acc.type === "type2") {
            try {
                const tx = await signerContract.executePolicy(0);
                const receipt = await tx.wait();
                results.push({
                    tenantId: acc.tenantId,
                    address: acc.address,
                    type: acc.type,
                    level: acc.level,
                    status: "✅ Success",
                    txHash: receipt.transactionHash
                });
            } catch (error) {
                results.push({
                    tenantId: acc.tenantId,
                    address: acc.address,
                    type: acc.type,
                    level: acc.level,
                    status: "❌ Failure",
                    error: error.reason || error.message
                });
            }
        } else {
            // type1 用户直接失败
            results.push({
                tenantId: acc.tenantId,
                address: acc.address,
                type: acc.type,
                level: acc.level,
                status: "❌ Failure",
                error: "Unauthorized: Only type2 users can execute policies"
            });
        }
    }

    // 保存执行结果
    const outputPath = path.join(__dirname, 'execution_results.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n📝 Results saved to ${outputPath}`);

    // 测试审计日志读取权限
    await testReadPolicy(policyContract, provider);
}

async function testReadPolicy(policyContract, provider) {
    console.log("\n=== 🔍 Testing audit log access ===");
    const readResults = [];

    // 随机选择10个用户的数据作为审计记录
    const sampleData = csvData.slice(0, 10);

    // 遍历所有用户进行访问测试
    for (const acc of accounts) {
        // 对每个样本数据进行访问测试
        for (const data of sampleData) {
            const auditRecord = {
                reader: acc.tenantId,
                readerType: acc.type,
                readerLevel: acc.level,
                // 记录的完整信息
                record: {
                    tenant_ID: data.tenant_ID,
                    userID: data.userID,
                    action_type: data.action_type,
                    policy_version: data.policy_version,
                    security: data.security,
                    response: data.response,
                    event_id: data.event_id,
                    timestamp: data.timestamp,
                    hash: data.hash,
                    severity: data.severity,
                    tenant_type: data.tenant_type
                }
            };

            // Cloud Admin 可以看到所有字段
            if (acc.type === "type2") {
                readResults.push(auditRecord);
            } 
            // Network Admin 只能看到部分字段
            else if (acc.level === "Network Admin") {
                const limitedRecord = {
                    reader: auditRecord.reader,
                    readerType: auditRecord.readerType,
                    readerLevel: auditRecord.readerLevel,
                    record: {
                        tenant_ID: data.tenant_ID,
                        action_type: data.action_type,
                        response: data.response,
                        timestamp: data.timestamp,
                        severity: data.severity
                    }
                };
                readResults.push(limitedRecord);
            }
        }
    }

    // 保存审计日志访问结果
    const auditPath = path.join(__dirname, 'audit_access_results.json');
    fs.writeFileSync(auditPath, JSON.stringify(readResults, null, 2));
    console.log(`📝 Audit access results saved to ${auditPath}`);
}

main().catch((err) => {
    console.error("❌ Execution error:", err);
    process.exitCode = 1;
});
/*
async function testReadPolicy() {
    console.log("\n=== 🔍 test: who can read policy ===");
    for (const acc of accounts) {
      const wallet = new ethers.Wallet(acc.privateKey, provider);
      const signerContract = contract.connect(wallet);
      try {
        const policy = await signerContract.policies(0);  // or getPolicy()
        console.log(`${acc.tenantId} | ${acc.address} | ✅ Read success: ${policy.policyName}`);
      } catch (error) {
        console.log(`${acc.tenantId} | ${acc.address} | ❌ Read failed: ${error.reason || error.message}`);
      }
    }
  }

  
  async function testBlockedBehavior() {
    console.log("\n=== 🚫 test: blocked behavior ===");
    for (const acc of accounts) {
      const wallet = new ethers.Wallet(acc.privateKey, provider);
      const signerContract = contract.connect(wallet);
  
      try {
        const tx = await signerContract.restrictedAction(0);  // 模拟违规调用
        const receipt = await tx.wait();
        console.log(`${acc.tenantId} | ${acc.address} | ⚠️ Unexpected success | tx: ${receipt.transactionHash}`);
      } catch (error) {
        console.log(`${acc.tenantId} | ${acc.address} | ✅ Blocked as expected | ${error.reason || error.message}`);
      }
    }
  }
  */