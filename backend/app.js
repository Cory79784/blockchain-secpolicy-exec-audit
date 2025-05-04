const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const app = express();

// 路由引入
const authRouter = require('./routes/auth');
const policyRouter = require('./routes/policy');
const auditRouter = require('./routes/audit');
const tenantRouter = require('./routes/tenant');

// 中间件
app.use(cors());
app.use(express.json());

// 路由挂载
app.use('/api/auth', authRouter);
app.use('/api/policy', policyRouter);
app.use('/api/audit', auditRouter);
app.use('/api/tenant', tenantRouter);

// 启动服务器
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log('Environment variables loaded:', {
            RPC_URL: process.env.RPC_URL,
            PRIVATE_KEY: process.env.PRIVATE_KEY ? 'Set' : 'Not Set',
            POLICY_CONTRACT_ADDRESS: process.env.POLICY_CONTRACT_ADDRESS,
            AUDIT_CONTRACT_ADDRESS: process.env.AUDIT_CONTRACT_ADDRESS,
            TENANT_CONTRACT_ADDRESS: process.env.TENANT_CONTRACT_ADDRESS
        });
    });
}

module.exports = app; 