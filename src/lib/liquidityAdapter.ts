import type { UniswapPoolDayData } from "../types/uniswap";

const addLiquidity = async (amount: string, pool: UniswapPoolDayData) => {

    const source = pool.source;
    
    switch(source) {
        case "v3":
            return addLiquidityV3(amount, pool);
        case "v4":
            return addLiquidityV4(amount, pool);
        default:
            throw new Error("Invalid source");
    }
  
}

const addLiquidityV3 = async (amount: string, pool: UniswapPoolDayData) => {
   
}

const addLiquidityV4 = async (amount: string, pool: UniswapPoolDayData) => {

}

export { addLiquidity };