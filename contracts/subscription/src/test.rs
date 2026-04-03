#![cfg(test)]
use super::*;
use soroban_sdk::testutils::{Address as _};
use soroban_sdk::{Address, Env, token};

#[test]
fn test_subscription_payment() {
    let env = Env::default();
    env.mock_all_auths();

    // Register our contract
    let contract_id = env.register_contract(None, SubscriptionContract);
    let client = SubscriptionContractClient::new(&env, &contract_id);

    // Setup accounts
    let creator = Address::generate(&env);
    let subscriber = Address::generate(&env);

    // Register a mock token contract
    let token_admin = Address::generate(&env);
    let token_id = env.register_stellar_asset_contract(token_admin.clone());
    let token_client = token::StellarAssetClient::new(&env, &token_id);
    
    // Fund the subscriber
    token_client.mint(&subscriber, &100000000);

    // Initialize with only creator (matching TipJar pattern)
    client.init(&creator);
    assert_eq!(client.get_creator(), creator);

    // Perform a 'tip' call
    client.tip(&subscriber, &token_id, &10000000);
    
    // Verify balances
    let token_query = token::Client::new(&env, &token_id);
    assert_eq!(token_query.balance(&creator), 10000000);
    assert_eq!(token_query.balance(&subscriber), 90000000);
}

#[test]
#[should_panic(expected = "already initialized")]
fn test_already_initialized() {
    let env = Env::default();
    let contract_id = env.register_contract(None, SubscriptionContract);
    let client = SubscriptionContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    client.init(&creator);
    client.init(&creator);
}
