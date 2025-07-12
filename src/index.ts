import { getBalancedPoolsLast3Days } from "./lib/uniswap";

const main = async () => {
  const pools = await getBalancedPoolsLast3Days();
  console.log(pools);
};

main();
