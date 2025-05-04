const hre = require("hardhat");
const ethers = hre.ethers;
const { ethers: localEthers } = require("ethers"); // 只用parseEther等工具
const fs = require("fs");

async function main() {
    // 读取TenantManagement合约地址
    const deploymentData = require("../deployments/localhost.json");
    const tenantManagementAddress = deploymentData.TenantManagement;
    
    const TenantManagement = await ethers.getContractFactory("TenantManagement");
    const tenantManagement = TenantManagement.attach(tenantManagementAddress);

    // 获取默认账户（用来签交易）
    const [funder] = await ethers.getSigners();

    // 生成1000个钱包
    const wallets = [];
    for (let i = 0; i < 220; i++) {
        const wallet = ethers.Wallet.createRandom();
        wallets.push(wallet);
    }

    // 保存钱包
    const walletData = wallets.map(w => ({
        address: w.address,
        privateKey: w.privateKey
    }));
    fs.writeFileSync("generated_wallets.json", JSON.stringify(walletData, null, 2));
    console.log("✅ Wallets generated and saved.");

    // 用funder代理注册租户
    console.log("Registering tenants...");
    for (let i = 0; i < wallets.length; i++) {
        const wallet = wallets[i];

        // 注册时仍然是以funder签名，但用wallet.address作为租户id
        const tenantId = `tenant_${i}`;
        const role = "tenant";
        const tenantType = (i < 20) ? "type2" : "type1";
        const type1Detail = (tenantType === "type2") ? "" : (
            i % 10 === 0 ? "Network Admin" :
            i % 3 === 0 ? "Level2" : "Level1"
        );

        try {
            const tx = await tenantManagement.connect(funder).registerTenant(
                tenantId,
                role,
                tenantType,
                type1Detail
            );
            await tx.wait();
            if (i % 50 === 0) console.log(`⏳ Registered ${i} tenants...`);
        } catch (error) {
            console.error(`❌ Failed to register tenant ${i}:`, error.message);
        }
    }
    console.log("✅ All tenants registered.");
}

main().catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
});
