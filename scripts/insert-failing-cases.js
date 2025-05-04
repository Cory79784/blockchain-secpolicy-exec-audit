// scripts/insert-failing-cases.js

/**
 * This script manually injects several failed policy execution attempts
 * into the smart contract system, in order to test how well the
 * AuditLogging contract captures and records unsuccessful operations.
 *
 * It uses two failure types:
 *  1. Execution attempt by a non-registered tenant
 *  2. Execution attempt by a tenant who is not the policy owner
 *
 * The expected behavior is that the AuditLogging contract will log
 * these failed attempts with success = false, enabling security audits.
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Load deployed contract addresses
const deploymentPath = path.join(__dirname, "../deployments/localhost.json");
const addresses = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

async function main() {
  const signers = await hre.ethers.getSigners();

  // Attach to deployed contracts
  const TenantManagement = await hre.ethers.getContractFactory("TenantManagement");
  const tenantContract = await TenantManagement.attach(addresses.TenantManagement);

  const PolicyExecution = await hre.ethers.getContractFactory("PolicyExecution");
  const policyContract = await PolicyExecution.attach(addresses.PolicyExecution);

  console.log("🚨 Injecting failing transactions for testing...");

  // -------------------------------
  // Case 1: Unregistered user (new wallet) tries to execute a policy
  // -------------------------------
  const unregisteredWallet = hre.ethers.Wallet.createRandom().connect(hre.ethers.provider);

  // Transfer 0.01 ETH from signer[0] to give gas to the new wallet
  const tx = await signers[0].sendTransaction({
    to: unregisteredWallet.address,
    value: hre.ethers.parseEther("0.01")
  });
  await tx.wait();

  try {
    await policyContract.connect(unregisteredWallet).executePolicy(0); // Should fail
  } catch (err) {
    console.log(`❌ [Unregistered] Execution failed as expected: ${err.message}`);
  }

  // -------------------------------
  // Case 2: Registered user (not owner) tries to execute another's policy
  // -------------------------------
  const owner = signers[0];         // Owner of policy 0
  const nonOwner = signers[1];      // Registered, but not owner of policy 0

  try {
    await policyContract.connect(nonOwner).executePolicy(0); // Should fail
  } catch (err) {
    console.log(`❌ [Not Owner] Execution failed as expected: ${err.message}`);
  }

  console.log("✅ Failed cases injected. Use verify-logs.js to confirm logs.");
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
