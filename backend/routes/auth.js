const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const router = express.Router();

// 读取CSV文件，动态加载用户信息
const users = {};

const csvFilePath = path.join(__dirname, '../../data_simulation/On-chain_Data_Updated.csv');

// 加载所有用户到内存
fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on('data', (row) => {
    const email = row.userID + '@example.com'; // ⚡️用userID生成email，保证唯一性（你可以自己改规则）
    users[email] = {
      password: '123456',  // 默认密码（如果有单独密码字段可以改成row.password）
      tenantId: row.tenantID,
      tenantRole: row.tenant_role,
      tenantType: row.tenant_type,
      type1Detail: row.type1_detail
    };
  })
  .on('end', () => {
    console.log('User data loaded from CSV');
  });

// 登录接口
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users[username];

  if (user && user.password === password) {
    const token = jwt.sign({
      username,
      tenantId: user.tenantId,
      tenantRole: user.tenantRole,
      tenantType: user.tenantType,
      type1Detail: user.type1Detail
    }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

module.exports = router;
