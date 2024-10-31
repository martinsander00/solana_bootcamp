import { ActionGetResponse, ActionPostRequest, ACTIONS_CORS_HEADERS, createPostResponse } from "@solana/actions"
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { Votingdapp } from '@/../anchor/target/types/votingdapp';
import { AnchorError, Program } from "@coral-xyz/anchor";
import BN from "bn.js"; // Make sure BN is also imported


const IDL = require('@/../anchor/target/idl/votingdapp.json')

const votingAddress = new PublicKey("AsjZ3kWAUSQRNt2pZVeJkywhZ6gpLpHZmJjduPmKZDZZ");

export const OPTIONS = GET;

export async function GET(request: Request) {
  
  const actionMetadata: ActionGetResponse = {
    type: "action",
    icon: "https://imgs.search.brave.com/ff2jVJasa_Z6MxP7WwzaiNtfNCwtCKNoeAJog9nx8mU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90NC5m/dGNkbi5uZXQvanBn/LzAwLzk0LzI4LzM1/LzM2MF9GXzk0Mjgz/NTg5X1doUm81MlJy/cHhvbnpON2hxTTFY/eDhZVXd3NnhPYlhs/LmpwZw",
    title: "Vote for your favorite type of peanut butter!",
    description: "Vote between crunchy and smooth.",
    label: "Vote",
    links: {
      actions: [
        {
          href: "/api/vote?candidate=Crunchy",
          label: "Vote for Crunchy",
          type: "transaction",
        },
        {
          href: "/api/vote?candidate=Smooth",
          label: "Vote for Smooth",
          type: "transaction"
        }
      ]
    }
  };
  return Response.json(actionMetadata, { headers: ACTIONS_CORS_HEADERS });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const candidate = url.searchParams.get("candidate");

  if (candidate != "Crunchy" && candidate != "Smooth") {
    return new Response("Invalid candidate", {status: 400, headers: ACTIONS_CORS_HEADERS});
  }

  const connection = new Connection("http://127.0.0.1:8899", "confirmed");
  const program: Program<Votingdapp> = new Program(IDL, {connection});
  const body: ActionPostRequest = await request.json();
  let voter;

  try {
    voter = new PublicKey(body.account);
  } catch (error) {
    return new Response("Invalid account", {status: 400, headers: ACTIONS_CORS_HEADERS});
  }

  const instruction = await program.methods.vote(candidate, new BN(1))
  .accounts({
    signer: voter,
  })
  .instruction();

    const blockhash = await connection.getLatestBlockhash();

    const transaction = new Transaction({
      feePayer: voter,
      blockhash: blockhash.blockhash,
      lastValidBlockHeight: blockhash.lastValidBlockHeight,
    })
    .add(instruction);

      const response = await createPostResponse({
        fields: {
          type: "transaction",  // Add this type field
          transaction: transaction,
        }
      });

      return Response.json(response, {headers: ACTIONS_CORS_HEADERS});

}