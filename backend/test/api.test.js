const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = chai;
const app = require('../app');

chai.use(chaiHttp);

describe('API Tests', () => {
    let authToken = '';
    let testPolicyId = '';

    // 测试登录
    describe('POST /api/auth/login', () => {
        it('should login successfully', (done) => {
            chai.request(app)
                .post('/api/auth/login')
                .send({
                    username: 'admin@example.com',
                    password: '123456'
                })
                .end((err, res) => {
                    if (err) {
                        console.error('Login error:', err);
                        done(err);
                        return;
                    }
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('token');
                    authToken = res.body.token;
                    console.log('Login successful, token:', authToken);
                    done();
                });
        });
    });

    // 测试租户注册
    describe('POST /api/tenant/register', () => {
        it('should register tenant successfully', (done) => {
            chai.request(app)
                .post('/api/tenant/register')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    tenantId: 'tenantA',
                    role: 'admin',
                    type: 'type2',
                    level: 'Cloud Admin'
                })
                .end((err, res) => {
                    if (err) {
                        console.error('Register tenant error:', err);
                        done(err);
                        return;
                    }
                    expect(res).to.have.status(200);
                    done();
                });
        });
    });

    // 测试CSV导入
    describe('POST /api/policy/import-csv', () => {
        it('should import CSV data successfully', (done) => {
            chai.request(app)
                .post('/api/policy/import-csv')
                .set('Authorization', `Bearer ${authToken}`)
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('message', 'CSV data imported successfully');
                    done();
                });
        });
    });

    // 测试创建策略
    describe('POST /api/policy/create', () => {
        it('should create a policy successfully', (done) => {
            const policyData = {
                policyId: 1,
                policyName: '测试策略',
                policyType: '安全策略',
                policyContent: '测试内容',
                tenantId: 'tenantA'
            };

            chai.request(app)
                .post('/api/policy/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ policyData })
                .end((err, res) => {
                    if (err) {
                        console.error('Create policy error:', err);
                        done(err);
                        return;
                    }
                    console.log('Create policy response:', res.body);
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('message', 'Policy created');
                    testPolicyId = policyData.policyId;
                    done();
                });
        });
    });

    // 测试策略执行权限
    describe('POST /api/policy/execute', () => {
        it('should allow type2 Cloud Admin to execute policy', (done) => {
            chai.request(app)
                .post('/api/policy/execute')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ policyId: testPolicyId })
                .end((err, res) => {
                    if (err) {
                        console.error('Execute policy error:', err);
                        done(err);
                        return;
                    }
                    expect(res).to.have.status(200);
                    done();
                });
        });

        it('should deny type1 tenant to execute policy', (done) => {
            // 先注册一个 type1 租户
            chai.request(app)
                .post('/api/tenant/register')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    tenantId: 'tenantB',
                    role: 'user',
                    type: 'type1',
                    level: 'Level1'
                })
                .end((err, res) => {
                    if (err) {
                        console.error('Register tenant error:', err);
                        done(err);
                        return;
                    }
                    // 尝试执行策略
                    chai.request(app)
                        .post('/api/policy/execute')
                        .set('Authorization', `Bearer ${authToken}`)
                        .send({ policyId: testPolicyId })
                        .end((err, res) => {
                            expect(res).to.have.status(403);
                            done();
                        });
                });
        });
    });

    // 测试查询审计日志
    describe('GET /api/audit', () => {
        it('should get audit logs successfully', (done) => {
            chai.request(app)
                .get('/api/audit')
                .set('Authorization', `Bearer ${authToken}`)
                .end((err, res) => {
                    if (err) {
                        console.error('Get audit logs error:', err);
                        done(err);
                        return;
                    }
                    console.log('Get audit logs response:', res.body);
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('logs');
                    done();
                });
        });
    });
}); 