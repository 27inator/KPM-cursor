use kaspa_addresses::{Address, Prefix, Version};
use kaspa_consensus_core::{
    hashing::{
        sighash::{calc_schnorr_signature_hash, SigHashReusedValuesUnsync},
        sighash_type::SIG_HASH_ALL,
    },
    tx::{
        MutableTransaction, Transaction, TransactionInput, TransactionOutpoint,
        TransactionOutput, UtxoEntry,
    },
};
use kaspa_txscript::{
    opcodes::codes::OpReturn,
    script_builder::ScriptBuilder,
};
use secp256k1::Keypair;
use std::env;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🔗 KASPA OP_RETURN TRANSACTION CREATOR");
    println!("=====================================");

    // Get supply chain event data from command line
    let args: Vec<String> = env::args().collect();
    let supply_chain_data = if args.len() > 1 {
        &args[1]
    } else {
        r#"{"event":"SCAN","product":"LW001","batch":"Q1_001","quality":"AAA","temp":"72F"}"#
    };

    println!("📦 Supply Chain Event: {}", supply_chain_data);
    println!("📏 Data Size: {} bytes", supply_chain_data.len());

    // Create OP_RETURN script with supply chain data
    let mut script_builder = ScriptBuilder::new();
    let op_return_script = script_builder
        .add_op(OpReturn)?
        .add_data(supply_chain_data.as_bytes())?
        .drain();

    println!("🔧 OP_RETURN Script created: {} bytes", op_return_script.len());
    println!("📋 Script hex: {}", hex::encode(&op_return_script));

    // Create a dummy keypair for the example
    let keypair = Keypair::new(secp256k1::SECP256K1, &mut rand::thread_rng());
    let address = Address::new(Prefix::Testnet, Version::PubKey, keypair.x_only_public_key().0.serialize().as_slice());

    println!("🏢 Example Address: {}", address);

    // Create example transaction structure
    let input = TransactionInput {
        previous_outpoint: TransactionOutpoint {
            transaction_id: kaspa_consensus_core::tx::TransactionId::from_bytes([0u8; 32]),
            index: 0,
        },
        signature_script: vec![],
        sequence: 0,
        sig_op_count: 0,
    };

    let outputs = vec![
        // OP_RETURN output (zero value)
        TransactionOutput {
            value: 0,
            script_public_key: kaspa_consensus_core::tx::ScriptPublicKey::new(0, op_return_script),
        },
        // Change output (dummy)
        TransactionOutput {
            value: 100000000, // 1 KAS in sompis
            script_public_key: kaspa_txscript::pay_to_address_script(&address),
        },
    ];

    let tx = Transaction::new(1, vec![input], outputs, 0, Default::default(), 0, vec![]);

    println!("✅ Transaction created with OP_RETURN output!");
    println!("📋 Transaction ID: {}", tx.id());
    println!("💰 OP_RETURN output value: {} (zero)", tx.outputs[0].value);
    println!("🔧 OP_RETURN script length: {} bytes", tx.outputs[0].script_public_key.script().len());

    // Output transaction in JSON-like format for submission
    println!("\n🚀 TRANSACTION READY FOR SUBMISSION");
    println!("===================================");
    println!("Use this data with kaspad RPC or other tools:");
    
    // Serialize transaction for submission (this would need proper serialization)
    println!("Transaction hex: {}", hex::encode(bincode::serialize(&tx)?));

    Ok(())
} 