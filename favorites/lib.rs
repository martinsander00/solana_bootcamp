// import prelude
use anchor_lang::prelude::*;

declare_id!("5jeoy3jGg9GgtziARMC5DAFnPZ6GfKwVjpqfPnRphpBU");

// written to every account on the blockchain
// specifying the type of account that it is
pub const ANCHOR_DISCRIMINATOR_SIZE: usize = 8;

#[program]
pub mod favorites {
    use super::*;

    // This is the thing ppl are gonna call to do the transactions
    pub fn set_favorites(
        context: Context<SetFavorites>,
        number: u64,
        color: String,
        hobbies: Vec<String>,
    ) -> Result<()> {
        msg!("Greetings from {}", context.program_id); // write to the solana log file
        let user_public_key = context.accounts.user.key();

        msg!("User's public keylol: {}", user_public_key);
        msg!("User's favorite number: {}", number);
        msg!("User's favorite color: {}", color);
        msg!("User's hobbies: {:?}", hobbies);

        // write into the account provider
        context.accounts.favorites.set_inner(Favorites {
            number,
            color,
            hobbies,
        });

        Ok(())
    }
}

#[account]
#[derive(InitSpace)] // give our instances of Favorites the space of the attributes inside
pub struct Favorites {
    pub number: u64,

    #[max_len(50)]
    pub color: String,

    #[max_len(5, 50)]
    pub hobbies: Vec<String>,
}

#[derive(Accounts)]
pub struct SetFavorites<'info> {
    // info means that these will live for the lifetime of the account's info object
    #[account(mut)] //
    pub user: Signer<'info>,

    #[account(
        init_if_needed, // make the favorites account if it doesn't exist
        payer = user, // the user is the person who will sign the transaction
        space = ANCHOR_DISCRIMINATOR_SIZE + Favorites::INIT_SPACE,
        seeds = [b"favorites", user.key().as_ref()], // used to give this account an address on the blockchain
        bump 
    )]
    pub favorites: Account<'info, Favorites>,

    pub system_program: Program<'info, System>,
}

