const express = require('express');
const ethers = require('ethers');
const fs = require('fs');
const csv = require('csv-parser');
const router = express.Router();
const { verifyToken } = require('./verifyToken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// 检查环境变量
if (!process.env.PRIVATE_KEY) {
    console.error('PRIVATE_KEY is not set in .env file');
    process.exit(1);
}

if (!process.env.RPC_URL) {
    console.error('RPC_URL is not set in .env file');
    process.exit(1);
}

console.log('Using RPC URL:', process.env.RPC_URL);
console.log('Private key length:', process.env.PRIVATE_KEY.length);

// provider and signer
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY.trim(), provider);

// 合约实例
const policyContract = new ethers.Contract(
  process.env.POLICY_CONTRACT_ADDRESS,
  require('../../artifacts/contracts/PolicyExecution.sol/PolicyExecution.json').abi,
  signer
);

// 导入CSV数据
router.post('/import-csv', verifyToken, async (req, res) => {
  try {
    const results = [];
    const csvPath = path.join(__dirname, '../../data_simulation/On-chain_Data.csv');
    
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        // 批量处理数据
        for (const row of results) {
          try {
            const tx = await policyContract.createPolicy({
              policyId: row.policyId,
              policyName: row.policyName,
              policyType: row.policyType,
              policyContent: row.policyContent,
              tenantId: req.user.tenantId
            });
            await tx.wait();
            console.log(`Policy ${row.policyId} created successfully`);
          } catch (error) {
            console.error(`Error creating policy ${row.policyId}:`, error);
          }
        }
        res.json({ message: 'CSV data imported successfully' });
      });
  } catch (error) {
    console.error('Error importing CSV:', error);
    res.status(500).json({ message: 'Error importing CSV data' });
  }
});

// 创建策略
router.post('/create', verifyToken, async (req, res) => {
  const { policyData } = req.body;
  if (req.user.type !== 'type2') {
       return res.status(403).json({ message: 'Only type2 users (Cloud Admin) can create policies' });
     }
  try {
    // 先注册租户
    const tenantContract = new ethers.Contract(
      process.env.TENANT_CONTRACT_ADDRESS,
      require('../../artifacts/contracts/TenantManagement.sol/TenantManagement.json').abi,
      signer
    );

    // 检查是否已注册
    const isRegistered = await tenantContract.isTenant(signer.address);
    if (!isRegistered) {
      await tenantContract.registerTenant(policyData.tenantId, 'admin');
    }

    console.log('Creating policy with data:', policyData);
    const tx = await policyContract.createPolicy(
      policyData.policyName,
      policyData.policyContent,
      policyData.tenantId,
      'admin'
    );
    console.log('Transaction sent:', tx.hash);
    await tx.wait();
    console.log('Transaction confirmed');
    res.json({ message: 'Policy created' });
  } catch (error) {
    console.error('Error creating policy:', error);
    res.status(500).json({ 
      message: 'Error creating policy',
      error: error.message 
    });
  }
});

// 执行策略
router.post('/execute', verifyToken, async (req, res) => {
  const { policyId } = req.body;
  if (req.user.type !== 'type2') {
      return res.status(403).json({ message: 'Only type2 users (Cloud Admin) can execute policies' });
     }
  try {
    if (!policyId) {
      throw new Error('Policy ID is required');
    }

    console.log('Executing policy:', policyId);
    const tx = await policyContract.executePolicy(parseInt(policyId));
    console.log('Transaction sent:', tx.hash);
    await tx.wait();
    console.log('Transaction confirmed');
    res.json({ message: 'Policy executed' });
  } catch (error) {
    console.error('Error executing policy:', error);
    res.status(500).json({ 
      message: 'Error executing policy',
      error: error.message 
    });
  }
});

module.exports = router; 