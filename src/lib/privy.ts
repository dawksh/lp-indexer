import {PrivyClient, type User} from '@privy-io/server-auth';
import { base } from 'viem/chains';
import { env } from './env';
import { createPublicClient, http } from 'viem';

const privy = new PrivyClient(env.PRIVY_APP_ID, env.PRIVY_APP_SECRET);

const getOrCreateWallet = async (userId: string, username: string): Promise<User & {balance: bigint}> => {
    const publicClient = createPublicClient({
        chain: base,
        transport: http(),
    });
    const wallet = await privy.getUserByCustomAuthId(userId);
    if (!wallet) {
        const newUser = await privy.importUser({
            createEthereumWallet: true,
            linkedAccounts: [{
                type: "telegram",
                telegramUserId: userId,
                username,
            }],
        });
        return {...newUser, balance: await publicClient.getBalance({address: newUser.wallet?.address as `0x${string}` })};
    }
    return {...wallet, balance: await publicClient.getBalance({address: wallet.wallet?.address as `0x${string}` })};
}

export { privy, getOrCreateWallet };