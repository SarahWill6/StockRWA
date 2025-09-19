import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploying Stock Trading System contracts...");

  // Deploy StockTradingFactory first
  const deployedFactory = await deploy("StockTradingFactory", {
    from: deployer,
    log: true,
  });

  console.log(`StockTradingFactory contract: ${deployedFactory.address}`);

  // Deploy StockTrading contract with factory address
  const deployedTrading = await deploy("StockTrading", {
    from: deployer,
    args: [deployedFactory.address],
    log: true,
  });

  console.log(`StockTrading contract: ${deployedTrading.address}`);

  console.log("\nStock Trading System deployment completed!");
  console.log("Next steps:");
  console.log("1. Create stock tokens using StockTradingFactory.createStockToken()");
  console.log("2. Mint tokens to users using StockTradingFactory.mintStockTokens()");
  console.log("3. Users can trade using StockTrading contract");
};

export default func;
func.id = "deploy_stock_trading";
func.tags = ["StockTrading", "StockTradingFactory"];