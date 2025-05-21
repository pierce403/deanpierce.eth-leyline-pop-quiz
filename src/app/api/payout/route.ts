import { NextResponse } from "next/server";
import {
  createPublicClient,
  createWalletClient,
  http,
  privateKey,
  erc20ABI,
} from "viem";
import { baseUSDC } from "@daimo/contract";
import { base } from "viem/chains";

export async function POST(request: Request) {
  try {
    const { toAddress } = await request.json();
    const rpcUrl = process.env.RPC_URL;
    const walletPrivateKey = process.env.WALLET_PRIVATE_KEY;
    if (!rpcUrl || !walletPrivateKey) {
      return NextResponse.json(
        { error: "Server not configured" },
        { status: 500 }
      );
    }
    const publicClient = createPublicClient({
      transport: http(rpcUrl),
      chain: base,
    });
    const walletClient = createWalletClient({
      transport: privateKey(walletPrivateKey),
      chain: base,
    });
    // USDC has 6 decimals
    const decimals = 6;
    const amount = BigInt(Math.floor(1.1 * 10 ** decimals));
    const tx = await walletClient.writeContract({
      abi: erc20ABI,
      address: baseUSDC.token,
      functionName: "transfer",
      args: [toAddress, amount],
    });
    return NextResponse.json({ txHash: tx.hash });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
