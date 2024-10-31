// Import necessary modules from Anchor and Solana
import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Keypair, PublicKey } from '@solana/web3.js'
import { Votingdapp } from '../target/types/votingdapp'
import { startAnchor } from 'anchor-bankrun'
import { BankrunProvider } from 'anchor-bankrun'

// Import the IDL (Interface Definition Language) JSON file for the Votingdapp program.
// This file contains the program's API structure and instructions.
const IDL = require('../target/idl/votingdapp.json');

// Define the voting program's address on the Solana blockchain as a PublicKey
const votingAddress = new PublicKey("AsjZ3kWAUSQRNt2pZVeJkywhZ6gpLpHZmJjduPmKZDZZ");

// Begin a test suite named 'votingdapp'
describe('votingdapp', () => {

  let context;
  let provider;
  anchor.setProvider(anchor.AnchorProvider.env());
  let votingProgram: Program<Votingdapp>;

  beforeAll(async () => {
    // Start the Anchor testing environment and create the necessary context.
    context = await startAnchor("", [{ name: "votingdapp", programId: votingAddress }], []);
  
    // Set up a provider using BankrunProvider to interface with the Anchor environment
    provider = new BankrunProvider(context);
  
    // Set the provider globally for Anchor
    anchor.setProvider(provider);
  
    // Initialize the Votingdapp program with the IDL and program ID
    votingProgram = new Program<Votingdapp>(
      IDL,
      provider
    );
  });
  
  
  

  it('initialize poll', async () => {
    // Call the `initializePoll` method on the votingProgram to create a new poll
    await votingProgram.methods.initializePoll(
      new anchor.BN(1),         // poll_id
      new anchor.BN(0), // poll_start
      new anchor.BN(1830002472),          // poll_end
      "What is your favorite type of hamburger?" // description
    ).rpc(); // Sends this transaction as an RPC call to the Solana blockchain

    // Derive the poll's public address using `poll_id` as a seed
    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8)], // Convert `poll_id` to a buffer and use it as a seed
      votingAddress // The program's public key
    );

    // Fetch the poll account data from the blockchain
    const poll = await votingProgram.account.poll.fetch(pollAddress);
    console.log(poll);

    expect(poll.pollId.toNumber()).toEqual(1);
    expect(poll.description).toEqual("What is your favorite type of hamburger?");
    expect(poll.pollStart.toNumber()).toBeLessThan(poll.pollEnd.toNumber());
  })

  it("initialize candidate", async() => {
    await votingProgram.methods.initializeCandidate(
      "Smooth",
      new anchor.BN(1),
    ).rpc();
    await votingProgram.methods.initializeCandidate(
      "Crunchy",
      new anchor.BN(1),
    ).rpc();

    const [crunchyAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Crunchy")],
      votingAddress,
    );
    const crunchyCandidate = await votingProgram.account.candidate.fetch(crunchyAddress);
    console.log(crunchyCandidate);
    expect(crunchyCandidate.candidateVotes.toNumber()).toEqual(0);

    const [smoothAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Smooth")],
      votingAddress,
    );
    const smoothCandidate = await votingProgram.account.candidate.fetch(smoothAddress);
    console.log(smoothCandidate);
    expect(smoothCandidate.candidateVotes.toNumber()).toEqual(0);

  })

  it("vote", async() => {
    await votingProgram.methods.vote("Smooth", new anchor.BN(1)).rpc();

    const [smoothAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Smooth")],
      votingAddress,
    );
    const smoothCandidate = await votingProgram.account.candidate.fetch(smoothAddress);
    console.log(smoothCandidate);
    expect(smoothCandidate.candidateVotes.toNumber()).toEqual(1);
  })
})
