const express = require('express');
const ethers = require('ethers');
const router = express.Router();
const { verifyToken } = require('./verifyToken');

// provider and signer
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// 审计合约实例
const auditContract = new ethers.Contract(
  process.env.AUDIT_CONTRACT_ADDRESS,
  require('../../artifacts/contracts/AuditLogging.sol/AuditLogging.json').abi,
  signer
);

router.get('/', verifyToken, async (req, res) => {
  try {
    const logs = await auditContract.getLogsByTenant(req.user.tenantId);

    const filteredLogs = logs.map(log => {
        if (req.user.type === 'type2') {
          return log; // Type-2用户看所有字段
        } else if (req.user.role === 'admin') {
          // Network Admin可以看所有Type-1租户的日志（但是字段是限定的）
          const { Time, UserID, EventType, EventStatus, ClientAddress, ResourceAccessed, CompulsoryEvent, ComponentID } = log;
          return { Time, UserID, EventType, EventStatus, ClientAddress, ResourceAccessed, CompulsoryEvent, ComponentID };
        } else if (req.user.role === 'tenant') {
          // Level-1 or Level-2
          if (req.user.level === 'level1') {
            const { Time, UserID, EventType } = log;
            return { Time, UserID, EventType };
          } else {
            const { Time, UserID, EventType, EventStatus, ClientAddress, ResourceAccessed } = log;
            return { Time, UserID, EventType, EventStatus, ClientAddress, ResourceAccessed };
          }
        }
      });
      

    res.json({ logs: filteredLogs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching audit logs' });
  }
});

// 获取租户的审计日志
router.get('/tenant/:tenantId', verifyToken, async (req, res) => {
  const { tenantId } = req.params;
  try {
    console.log('Fetching audit logs for tenant:', tenantId);
    const logs = await auditContract.getLog(tenantId);
    console.log('Audit logs:', logs);
    res.json({ logs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ 
      message: 'Error fetching audit logs',
      error: error.message 
    });
  }
});

module.exports = router; 