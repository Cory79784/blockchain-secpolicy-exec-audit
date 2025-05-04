async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Wallet Address:", signer.address);
  const balance = await signer.provider.getBalance(signer.address);
  console.log("Wallet Balance:", ethers.formatEther(balance), "MATIC");
}

main().catch(console.error);
