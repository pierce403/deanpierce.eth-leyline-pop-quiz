import { NextResponse } from "next/server";
import {
  createPublicClient,
  createWalletClient,
  http,
  erc20Abi,
  isAddress,
} from "viem";
import { privateKeyToAccount } from 'viem/accounts';
import { baseUSDC } from "@daimo/contract";
import { base } from "viem/chains";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { toAddress?: unknown };

    if (typeof body.toAddress !== 'string') {
      return NextResponse.json(
        { error: "toAddress must be a string." },
        { status: 400 }
      );
    }
    if (!isAddress(body.toAddress)) {
      return NextResponse.json(
        { error: "Invalid toAddress format. Please provide a valid Ethereum address." },
        { status: 400 }
      );
    }
    const validatedToAddress = body.toAddress as `0x${string}`;

    const rpcUrl = process.env.RPC_URL;
    const walletPrivateKey = process.env.WALLET_PRIVATE_KEY as `0x${string}` | undefined;

    if (!rpcUrl || !walletPrivateKey) {
      return NextResponse.json(
        { error: "Server not configured" },
        { status: 500 }
      );
    }

    const account = privateKeyToAccount(walletPrivateKey);

    const publicClient = createPublicClient({
      chain: base,
      transport: http(rpcUrl),
    });

    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: http(rpcUrl),
    });

    const decimals = 6;
    const amount = BigInt(Math.floor(1.1 * 10 ** decimals));

    const txHashValue = await walletClient.writeContract({
      abi: erc20Abi,
      address: baseUSDC.token,
      functionName: "transfer",
      // @ts-ignore - Suppressing persistent TS/linter issue with viem's 0x${string} type in the args array
      args: [validatedToAddress, amount],
    });

    return NextResponse.json({ txHash: txHashValue });
  } catch (error: any) {
    let message = "An unknown error occurred.";
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }
    console.error("Payout API Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
