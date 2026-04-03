const serviceNameInput = document.getElementById("serviceName");
const serviceAmountInput = document.getElementById("serviceAmount");
const addServiceButton = document.getElementById("addServiceButton");
const subsList = document.getElementById("subsList");
const statusMessage = document.getElementById("statusMessage");

// Contract Config
const CONTRACT_ID = "CAGGWVXWEGUQADRLNMFYD5YXSP5EN7OZPHWAZGH3ISZGULWSER2KIBQJ";
const RECIPIENT = "G..."; // Platform recipient address (To be updated via UI or hardcoded)

let subscriptions = JSON.parse(localStorage.getItem("subs_remi_list") || "[]");

function saveSubs() {
    localStorage.setItem("subs_remi_list", JSON.stringify(subscriptions));
}

function renderSubs() {
    subsList.innerHTML = "";
    if (subscriptions.length === 0) {
        subsList.innerHTML = "<li>No subscriptions added yet.</li>";
        return;
    }

    subscriptions.forEach((sub, index) => {
        const li = document.createElement("li");
        li.className = "sub-item";
        li.innerHTML = `
            <div class="sub-info">
                <h4>${sub.name}</h4>
                <p>${sub.amount} XLM / Month</p>
            </div>
            <div class="sub-actions">
                <button onclick="paySubscription(${index})" class="primary">Pay Now</button>
                <button onclick="removeSubscription(${index})" style="color: red; border-color: #fee2e2;">Delete</button>
            </div>
        `;
        subsList.appendChild(li);
    });
}

function addSubscription() {
    const name = serviceNameInput.value.trim();
    const amount = parseFloat(serviceAmountInput.value);

    if (!name || isNaN(amount) || amount <= 0) {
        alert("Please enter a valid service name and amount.");
        return;
    }

    subscriptions.push({ name, amount });
    saveSubs();
    renderSubs();
    serviceNameInput.value = "";
}

function removeSubscription(index) {
    subscriptions.splice(index, 1);
    saveSubs();
    renderSubs();
}

async function paySubscription(index) {
    const sub = subscriptions[index];
    const btn = event.target;
    if (!btn) return;
    const originalText = btn.textContent;

    try {
        btn.textContent = "Connecting...";
        btn.disabled = true;

        const freighterMod = await import('https://cdn.jsdelivr.net/npm/@stellar/freighter-api@2.0.0/+esm');
        const freighter = freighterMod.default || freighterMod;

        if (!(await freighter.isConnected())) {
            throw new Error("Freighter extension is not responding. Ensure it is unlocked!");
        }

        const pubKey = await freighter.requestAccess();
        if (!pubKey) throw new Error("Wallet access denied");

        btn.textContent = "Simulating...";
        const server = new StellarSdk.rpc.Server("https://soroban-testnet.stellar.org");
        const account = await server.getAccount(pubKey);
        const contract = new StellarSdk.Contract(CONTRACT_ID);

        const call = contract.call(
            "pay",
            new StellarSdk.Address(pubKey).toScVal(),
            StellarSdk.nativeToScVal(BigInt(Math.floor(sub.amount * 10000000)), { type: "i128" })
        );

        let tx = new StellarSdk.TransactionBuilder(account, { 
            fee: "100000", 
            networkPassphrase: StellarSdk.Networks.TESTNET 
        }).addOperation(call).setTimeout(30).build();

        const sim = await server.simulateTransaction(tx);
        if (sim.error) throw new Error("Simulation failed: " + (sim.error.message || JSON.stringify(sim.error)));

        // Assemble v12 style
        btn.textContent = "Assembling...";
        tx = StellarSdk.rpc.assembleTransaction(tx, sim).build();

        // THE MOST RESILIENT XDR EXTRACTION
        let xdrBase64;
        try {
            if (typeof tx === "string") {
                xdrBase64 = tx;
            } else if (tx && tx.transaction && typeof tx.transaction === "string") {
                xdrBase64 = tx.transaction;
            } else if (tx && typeof tx.toXDR === "function") {
                xdrBase64 = tx.toXDR("base64");
                if (typeof xdrBase64 !== "string") {
                    xdrBase64 = StellarSdk.xdr.TransactionEnvelope.fromXDR(xdrBase64).toXDR("base64");
                }
            } else if (tx && typeof tx.toEnvelope === "function") {
                xdrBase64 = tx.toEnvelope().toXDR("base64");
            } else {
                throw new Error("No toXDR method found on tx object.");
            }
        } catch (e) {
            throw new Error("Could not extract XDR string from transaction.");
        }

        btn.textContent = "Sign in Freighter...";
        const xdrToSign = String(xdrBase64);
        let freighterResult;
        try {
            freighterResult = await freighter.signTransaction(xdrToSign, "TESTNET");
        } catch (e) {
            freighterResult = await freighter.signTransaction(xdrToSign, { network: "TESTNET" });
        }

        const signedXdr = (freighterResult && typeof freighterResult === "object" && freighterResult.signedTxXdr)
            ? freighterResult.signedTxXdr
            : freighterResult;

        if (!signedXdr || typeof signedXdr !== "string") {
            throw new Error("Freighter did not return a valid signed transaction string.");
        }

        btn.textContent = "Sending...";
        const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, StellarSdk.Networks.TESTNET);
        const resp = await server.sendTransaction(signedTx);
        if (resp.status === "ERROR") throw new Error("Transaction send failed! " + (resp.errorResultXdr || ""));

        btn.textContent = "Confirming...";
        let status = "PENDING";
        while (status === "PENDING") {
            await new Promise(r => setTimeout(r, 2000));
            const res = await server.getTransaction(resp.hash);
            status = res.status;
            if (status === "SUCCESS") {
                showSuccess(`Paid ${sub.amount} XLM to ${sub.name}!`);
                break;
            } else if (status === "FAILED") {
                throw new Error("Transaction failed on chain. (Tip: Ensure contract is initialized)");
            }
        }
    } catch (e) {
        console.error(e);
        alert("Payment Error: " + e.message);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

function showSuccess(msg) {
    const card = document.createElement("div");
    card.className = "success-card";
    card.innerHTML = `<h3>✅ Success</h3><p>${msg}</p>`;
    statusMessage.appendChild(card);
    setTimeout(() => card.remove(), 6000);
}

addServiceButton.addEventListener("click", addSubscription);
renderSubs();
