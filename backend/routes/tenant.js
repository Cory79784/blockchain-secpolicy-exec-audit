const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const { verifyToken } = require('./verifyToken');

// 环境变量检查
if (!process.env.PRIVATE_KEY || !process.env.RPC_URL || !process.env.TENANT_CONTRACT_ADDRESS) {
    throw new Error('Missing required environment variables');
}

// 设置以太坊提供者
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// 加载合约
const tenantContract = new ethers.Contract(
    process.env.TENANT_CONTRACT_ADDRESS,
    [
        'function registerTenant(string memory _tenantId, string memory _role, string memory _type, string memory _level)',
        'function isTenant(address _tenant) public view returns (bool)'
    ],
    wallet
);

// 注册租户
router.post('/register', verifyToken, async (req, res) => {
    try {
        const { tenantId, role, type, level } = req.body;
        
        // 检查租户是否已注册
        const isRegistered = await tenantContract.isTenant(wallet.address);
        if (isRegistered) {
            return res.status(400).json({ error: 'Tenant already registered' });
        }

        // 注册租户
        const tx = await tenantContract.registerTenant(tenantId, role, type, level);
        await tx.wait();

        res.json({ message: 'Tenant registered successfully' });
    } catch (error) {
        console.error('Register tenant error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 