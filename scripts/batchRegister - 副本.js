const hre = require("hardhat");
const ethers = hre.ethers;
const { ethers: localEthers } = require("ethers"); // 引原版 ethers，只用工具函数
const fs = require("fs");



async function main() {
    // 读取TenantManagement合约
    const deploymentData = require("../deployments/localhost.json");
    const tenantManagementAddress = deploymentData.TenantManagement;
    
    const TenantManagement = await ethers.getContractFactory("TenantManagement");
    const tenantManagement = TenantManagement.attach(tenantManagementAddress);

    // 获取默认账户（用来打ETH）
    const [funder] = await ethers.getSigners();

    // 生成1000个钱包
    const wallets = [];
    for (let i = 0; i < 1000; i++) {
        const wallet = ethers.Wallet.createRandom().connect(funder.provider);
        wallets.push(wallet);
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // 打ETH给每个钱包
// 打ETH给每个钱包
console.log("Funding wallets...");
for (let i = 0; i < wallets.length; i++) {
    const wallet = wallets[i];
    const tx = await funder.sendTransaction({
        to: wallet.address,
        value: localEthers.parseEther("0.1")
    });
    await tx.wait();

    if (i % 20 === 0) {
        console.log(`⏳ Funded ${i} wallets, sleeping...`);
        await sleep(1000); // 每发送20个，休息1秒
    }
}


     // 保存生成的钱包（防止你丢失）
     const walletData = wallets.map(w => ({
        address: w.address,
        privateKey: w.privateKey
    }));
    fs.writeFileSync("generated_wallets.json", JSON.stringify(walletData, null, 2));
    console.log("Wallets generated and funded.");

    // 每个钱包自己注册租户
    console.log("Registering tenants...");
    for (let i = 0; i < wallets.length; i++) {
        const wallet = wallets[i];
        const tenantSigner = wallet.connect(funder.provider);

        const tenantManagementConnected = tenantManagement.connect(tenantSigner);

        // 随机分配type1/type2和Level1/Level2/Network Admin
        const tenantType = (i < 20) ? "type2" : "type1"; // 前20个是type2，后面是type1
        const type1Detail = (tenantType === "type2") ? "" : (
            i % 10 === 0 ? "Network Admin" :
            i % 3 === 0 ? "Level2" : "Level1"
        );

        try {
            const tx = await tenantManagementConnected.registerTenant(
                `tenant_${i}`,
                "tenant",         // role字段，写死成tenant
                tenantType,
                type1Detail
            );
            await tx.wait();
            console.log(`✅ Tenant ${i} registered: ${wallet.address}`);
        } catch (error) {
            console.error(`❌ Failed to register tenant ${i}:`, error.message);
        }
    }
}

main().catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
});