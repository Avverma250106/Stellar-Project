# SubsRemi - Subscription Tracker & Payment dApp

## Project Description
SubsRemi is a high-performance, SaaS-inspired fintech dashboard built on the Stellar Soroban network. It empowers users to manage their digital lives by tracking recurring subscriptions (like Netflix, Spotify, or SaaS tools) and executing secure, one-click on-chain payments using native XLM.

## Project Vision
Our vision is to bridge the gap between traditional subscription management and decentralized finance. We aim to provide a seamless "web2-feel" experience for web3 native users, making crypto payments for everyday services as intuitive as a traditional bank app.

## Key Features
- **Modern Fintech UI**: A sleek, glassmorphic dashboard for managing subscriptions with real-time status updates.
- **On-Chain Payments**: Securely execute transfers through a Soroban smart contract.
- **Resilient Wallet Integration**: Optimized Freighter wallet signing logic for 100% transaction success.
- **Local Persistence**: Save and track your services directly in your browser's secure storage.
- **Verified Smart Contract**: A robust Rust contract implementation with comprehensive unit test coverage.

## Deployed Smartcontract Details
- **Contract ID**: `CAGGWVXWEGUQADRLNMFYD5YXSP5EN7OZPHWAZGH3ISZGULWSER2KIBQJ`
- **Network**: Stellar Testnet
- **Explorer Verification**: [Stellar Expert - SubsRemi Contract](https://stellar.expert/explorer/testnet/contract/CAGGWVXWEGUQADRLNMFYD5YXSP5EN7OZPHWAZGH3ISZGULWSER2KIBQJ)

### Deployment Verification
![Deployed Contract Details](docs/images/deployed_contract.png)
*(Screenshot of the block explorer showing the deployed contract details)*

## UI Screenshots
![SubsRemi Dashboard](docs/images/ui_dashboard.png)
*(The main dashboard showing active subscriptions and the "Pay Now" interface)*

## Project Setup Guide

### 1. Prerequisites
- [Stellar CLI](https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup) installed.
- [Freighter Wallet](https://www.freighter.app/) extension (Testnet enabled).

### 2. Smart Contract Build & Test
```bash
cd contracts/subscription
cargo test
stellar contract build
```

### 3. Deploy & Initialize (Optional if using existing ID)
```bash
stellar contract deploy --wasm target/wasm32v1-none/release/subscription.wasm --source-account dev --network testnet
# Initialize the contract (Replace YOUR_WALLET with your public key)
stellar contract invoke --id <NEW_ID> --source-account dev --network testnet -- init --creator <YOUR_WALLET>
```

### 4. Run Frontend
```bash
# From the project root
python3 -m http.server 3001 --directory frontend
```
Navigate to: [http://localhost:3001](http://localhost:3001)

## Future Scope
- **Automated Recurring Payments**: Implementing Soroban timers for true hands-free subscription renewals.
- **Multi-Token Support**: Extending the payment layer to support USDC and other Stellar assets.
- **Mobile Integration**: Adding support for mobile wallets like Albedo and Rabet.
- **Email Notifications**: Integration with messaging protocols to remind users before payment deadlines.

---
Built with passion for the Stellar Ecosystem. 🚀💎
