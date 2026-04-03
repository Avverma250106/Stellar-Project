#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env};

#[contract]
pub struct SubscriptionContract;

#[contracttype]
pub enum DataKey {
    Creator,
}

#[contractimpl]
impl SubscriptionContract {
    /// Initialize the contract by setting the creator's address.
    pub fn init(env: Env, creator: Address) {
        if env.storage().instance().has(&DataKey::Creator) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Creator, &creator);
    }

    /// Match the exact payment pattern of TipJar.
    pub fn tip(env: Env, from: Address, token: Address, amount: i128) {
        from.require_auth();
        
        let creator: Address = env.storage().instance().get(&DataKey::Creator).expect("not initialized");
        
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&from, &creator, &amount);
    }

    /// Get the creator's address.
    pub fn get_creator(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Creator).expect("not initialized")
    }
}

mod test;
