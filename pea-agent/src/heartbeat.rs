use anyhow::Result;
use serde::Serialize;
use sha2::{Sha256, Digest};
use ed25519_dalek::{Keypair, Signer};
use base64::{engine::general_purpose, Engine as _};

#[derive(Serialize)]
pub struct Heartbeat<'a> {
    device_id: &'a str,
    timestamp: String,
    queue_size: u32,
    queue_bytes: u64,
    version: &'a str,
}

fn load_trust_token() -> Option<String> {
    use crate::vault::{Vault, VaultBackend};
    // Try OS keyring first, then file fallback
    for backend in [VaultBackend::OsKeyring, VaultBackend::File] {
        let v = Vault::with_backend("kmp-pea", "trust-ack-jwt", backend);
        if let Ok(bytes) = v.load_secret() {
            if let Ok(s) = String::from_utf8(bytes) { return Some(s); }
        }
    }
    None
}

pub async fn send_heartbeat(bus: &str, device_id: &str, kp: &Keypair) -> Result<()> {
    let (q_count, q_bytes) = crate::queue::stats().unwrap_or((0, 0));
    let hb = Heartbeat {
        device_id,
        timestamp: chrono::Utc::now().to_rfc3339(),
        queue_size: q_count as u32,
        queue_bytes: q_bytes as u64,
        version: env!("CARGO_PKG_VERSION"),
    };
    let payload = serde_json::to_vec(&hb)?;
    let mut h = Sha256::new();
    h.update(&payload);
    let digest = h.finalize();
    let sig = kp.sign(&payload);
    let client = reqwest::Client::new();
    let mut req = client
        .post(format!("{}/api/monitoring/heartbeat", bus))
        .header("X-PEA-Device-Id", device_id)
        .header("X-PEA-Public-Key", general_purpose::STANDARD.encode(kp.public.as_bytes()))
        .header("X-PEA-Signature", general_purpose::STANDARD.encode(sig.to_bytes()))
        .header("X-PEA-Payload-Hash", hex::encode(digest))
        .json(&hb);
    if let Some(tok) = load_trust_token() {
        req = req.header("Authorization", format!("Bearer {}", tok));
    }
    let _ = req.send().await?;
    Ok(())
} 