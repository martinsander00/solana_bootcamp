use anchor_lang::prelude::*;

// Without this, my program won't have a unique address on the network.
declare_id!("5jeoy3jGg9GgtziARMC5DAFnPZ6GfKwVjpqfPnRphpBU");

pub const ANCHOR_DISCRIMINATOR_SIZE: usize = 8; // Without this, Solana wouldn't know how to differentiate between different account types when stored on-chain.

#[program]
pub mod favorites {
    use super::*;

    pub fn set_favorites(
        context: Context<SetFavorites>, // `Context` provides access to the accounts involved in the transaction.
        // Without it, I couldn't access the `user` and `favorites` accounts needed to execute this function.
        number: u64,
        color: String,
        hobbies: Vec<String>,
    ) -> Result<()> {
        msg!("Greetings from {}", context.program_id);
        let user_public_key = context.accounts.user.key(); // Retrieves the user's public key from the context. 

        msg!("User's public keylol: {}", user_public_key);
        msg!("User's favorite number: {}", number);
        msg!("User's favorite color: {}", color);
        msg!("User's hobbies: {:?}", hobbies);

        // write into the account provider
        context.accounts.favorites.set_inner(Favorites { // `set_inner` updates the `favorites` account with new data (number, color, hobbies).
            number,
            color,
            hobbies,
        }); 
        // Without this, the new data wouldn't be saved to the blockchain.

        Ok(())
    }
}

#[account]
#[derive(InitSpace)] // Automatically calculates how much space is needed for storing instances of `Favorites` on-chain.
// Without this, I'd need to manually calculate the size, increasing the chance of errors.
pub struct Favorites {
    pub number: u64,

    #[max_len(50)]
    pub color: String,

    #[max_len(5, 50)]
    pub hobbies: Vec<String>,
}

#[derive(Accounts)]
pub struct SetFavorites<'info> { // Defines which accounts are involved in the `set_favorites` transaction.
    // Without this, the program wouldn't know which accounts to read/write from.

    #[account(mut)] // Marks this account as mutable, allowing changes (like updating the user's public key).
    pub user: Signer<'info>, // Represents the user signing the transaction. Without this, the transaction couldn't be verified.

    #[account(
        init_if_needed, // Creates the `favorites` account if it doesn't exist already.
        payer = user, // The `user` will pay for the transaction's fees and account creation (important for cost handling).
        space = ANCHOR_DISCRIMINATOR_SIZE + Favorites::INIT_SPACE, // Allocates space for the `favorites` data on-chain.
        seeds = [b"favorites", user.key().as_ref()], // Seeds are used to generate a unique address for the `favorites` account.
// `b"favorites"` is a constant seed, and `user.key().as_ref()` turns the user's public key into a byte slice for uniqueness.
// Without seeds, the program wouldn't know how to generate a unique account for each user.
        bump // Ensures the generated account is valid, using the "bump" to find a valid address. Without this, account generation could fail.
    )]
    pub favorites: Account<'info, Favorites>, // This represents the `favorites` account, which stores the user's favorite data.
// Without this account, there'd be nowhere to store the user's favorite number, color, and hobbies.

    pub system_program: Program<'info, System>, // The Solana system program handles account creation and payments.
// Without this, I couldn't create new accounts or handle transactions on the blockchain.
}
