use clap::{Arg, Command, ArgAction};
use anyhow::{Result, anyhow};
use serde::{Serialize, Deserialize};
use sha2::{Sha256, Digest};
use ed25519_dalek::{Keypair, PublicKey, Signature, Signer, SECRET_KEY_LENGTH};
use rand::rngs::OsRng;
use aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Nonce};
use base64::{engine::general_purpose, Engine as _};
use std::{fs, path::PathBuf};
use directories::ProjectDirs;
use std::time::{SystemTime, UNIX_EPOCH};
mod vault;
mod heartbeat;
mod scanner;
mod queue;
mod provision;
use vault::{Vault, VaultBackend};

fn save_trust_ack(token: &str) -> Result<()> {
    // Try OS keyring, then file
    let v1 = Vault::with_backend("kmp-pea", "trust-ack-jwt", VaultBackend::OsKeyring);
    if v1.store_secret(token.as_bytes()).is_ok() { return Ok(()); }
    let v2 = Vault::with_backend("kmp-pea", "trust-ack-jwt", VaultBackend::File);
    v2.store_secret(token.as_bytes())
}

#[derive(Debug, Serialize, Deserialize)]
struct Config {
    message_bus_url: String,
    company_id: u32,
}

#[derive(Debug, Serialize)]
struct ScanEvent<'a> {
    productId: &'a str,
    eventType: &'a str,
    location: &'a str,
    timestamp: String,
    metadata: serde_json::Value,
}

#[derive(Debug, Serialize)]
struct SubmitResult {
    device_id: String,
    public_key: String,
    signature_b64: String,
    payload_sha256: String,
}

fn device_id() -> String {
    format!("{}-{}", whoami::hostname(), whoami::username()).to_lowercase()
}

fn vault_dir() -> Result<PathBuf> {
    let proj = ProjectDirs::from("com","kmp","pea-agent").ok_or_else(|| anyhow!("no project dirs"))?;
    let dir = proj.data_dir().to_path_buf();
    fs::create_dir_all(&dir)?;
    Ok(dir)
}

fn vault_key() -> [u8; 32] {
    // Simple derivation from hostname+username for demo; replace with installer-secret/DPAPI in prod
    let mut hasher = Sha256::new();
    hasher.update(whoami::hostname());
    hasher.update(whoami::username());
    let out = hasher.finalize();
    let mut key = [0u8; 32];
    key.copy_from_slice(&out);
    key
}

fn load_or_generate_keypair() -> Result<Keypair> {
    let secret_bytes = Vault::load_or_store_secret_auto(
        "kmp-pea",
        "device-ed25519-sk",
        || {
            let mut rng = rand::rngs::OsRng;
            let kp = ed25519_dalek::Keypair::generate(&mut rng);
            kp.secret.to_bytes().to_vec()
        },
    )?;
    if secret_bytes.len() != SECRET_KEY_LENGTH { return Err(anyhow!("bad key len")); }
    let secret = ed25519_dalek::SecretKey::from_bytes(&secret_bytes)?;
    let public = PublicKey::from(&secret);
    Ok(Keypair { secret, public })
}

fn load_trust_ack() -> Option<String> {
    for backend in [VaultBackend::OsKeyring, VaultBackend::File] {
        let v = Vault::with_backend("kmp-pea", "trust-ack-jwt", backend);
        if let Ok(bytes) = v.load_secret() { if let Ok(s) = String::from_utf8(bytes) { return Some(s); } }
    }
    None
}

fn parse_jwt_exp(token: &str) -> Option<i64> {
    let parts: Vec<&str> = token.split('.').collect();
    if parts.len() != 3 { return None; }
    let payload = parts[1];
    let decoded = base64::engine::general_purpose::STANDARD.decode(payload.replace('-', "+").replace('_', "/"));
    if let Ok(bytes) = decoded {
        if let Ok(val) = serde_json::from_slice::<serde_json::Value>(&bytes) {
            return val.get("exp").and_then(|e| e.as_i64());
        }
    }
    None
}

async fn maybe_renew_token(bus: &str) -> anyhow::Result<()> {
    if let Some(tok) = load_trust_ack() {
        if let Some(exp) = parse_jwt_exp(&tok) {
            let now = chrono::Utc::now().timestamp();
            if exp - now <= 2 * 3600 { // renew if <=2h remaining
                let client = reqwest::Client::new();
                let resp = client.post(format!("{}/api/provisioning/renew", bus))
                    .header("Authorization", format!("Bearer {}", tok))
                    .timeout(std::time::Duration::from_secs(10))
                    .send().await?;
                if resp.status().is_success() {
                    if let Ok(v) = resp.json::<serde_json::Value>().await {
                        if let Some(new_tok) = v.get("trust_ack").and_then(|v| v.as_str()) {
                            let _ = save_trust_ack(new_tok);
                        }
                    }
                }
            }
        }
    }
    Ok(())
}

#[tokio::main]
async fn main() -> Result<()> {
    let matches = Command::new("pea-agent")
        .version("0.2.0")
        .about("KMP Per-Device Portable Edge Agent (minimal)")
        .arg(Arg::new("bus").long("bus").help("Message Bus base URL").default_value("http://localhost:3001"))
        .arg(Arg::new("company").long("company").help("Company ID").default_value("1"))
        .subcommand(Command::new("status").about("Show agent status"))
        .subcommand(Command::new("submit").about("Submit a signed scan").arg(Arg::new("product").required(true)))
        .subcommand(Command::new("provision").about("Provision this device").arg(Arg::new("secret").long("secret").required(true)).arg(Arg::new("company").long("company").required(false)))
        .subcommand(Command::new("scanner-sim").about("Simulate a scan").arg(Arg::new("product").required(true)))
        .subcommand(Command::new("scan-serial").about("Poll a serial port for scans").arg(Arg::new("port").long("port").required(true)).arg(Arg::new("duration").long("duration").default_value("30")))
        .subcommand(Command::new("scan-hid").about("Poll a HID device once").arg(Arg::new("path").long("path")).arg(Arg::new("vid").long("vid")).arg(Arg::new("pid").long("pid")))
        .subcommand(Command::new("queue-drain").about("Drain offline queue"))
        .subcommand(Command::new("devices").about("List available scanner devices"))
        .subcommand(Command::new("heartbeat").about("Send a one-shot heartbeat"))
        .subcommand(Command::new("heartbeat-loop").about("Run heartbeat loop").arg(Arg::new("interval").long("interval").default_value("3600")))
        .subcommand(Command::new("run").about("Run agent loop (heartbeat + queue drain)").arg(Arg::new("hb").long("hb").default_value("3600")).arg(Arg::new("qd").long("qd").default_value("30")))
        .subcommand(Command::new("reset").about("Reset device keys and re-provision").arg(Arg::new("secret").long("secret").required(true)).arg(Arg::new("company").long("company")))
        .subcommand(Command::new("uninstall").about("Securely wipe keys and queue"))
        .subcommand(Command::new("update-check").about("Check for updates"))
        .get_matches();

    let bus = matches.get_one::<String>("bus").unwrap().to_string();
    let company_id: u32 = matches.get_one::<String>("company").unwrap().parse().unwrap_or(1);

    match matches.subcommand() {
        Some(("status", _)) => {
            let kp = load_or_generate_keypair()?;
            println!("device_id: {}", device_id());
            println!("public_key_b64: {}", general_purpose::STANDARD.encode(kp.public.as_bytes()));
            println!("vault: {:?}", vault_dir()?);
            println!("bus: {}", bus);
            println!("company_id: {}", company_id);
            Ok(())
        }
        Some(("submit", sub)) => {
            let product = sub.get_one::<String>("product").unwrap();
            let kp = load_or_generate_keypair()?;
            let ts = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
            let event = ScanEvent {
                productId: product,
                eventType: "QUALITY_CHECK",
                location: &device_id(),
                timestamp: chrono::Utc::now().to_rfc3339(),
                metadata: serde_json::json!({ "device_id": device_id(), "ts": ts }),
            };
            let payload = serde_json::to_vec(&event)?;
            let payload_sha256 = {
                let mut h = Sha256::new();
                h.update(&payload);
                hex::encode(h.finalize())
            };
            let sig: Signature = kp.sign(&payload);
            let client = reqwest::Client::new();
            // renew token if needed
            let _ = maybe_renew_token(&bus).await;
            let mut req = client
                .post(format!("{}/api/supply-chain/event", bus))
                .header("X-PEA-Device-Id", device_id())
                .header("X-PEA-Public-Key", general_purpose::STANDARD.encode(kp.public.as_bytes()))
                .header("X-PEA-Signature", general_purpose::STANDARD.encode(sig.to_bytes()))
                .header("X-PEA-Payload-Hash", payload_sha256)
                .header("X-PEA-Nonce", uuid::Uuid::new_v4().to_string())
                .header("X-PEA-Timestamp", format!("{}", chrono::Utc::now().timestamp_millis()))
                .json(&event)
                .timeout(std::time::Duration::from_secs(30));
            if let Some(tok) = load_trust_ack() { req = req.header("Authorization", format!("Bearer {}", tok)); }
            let resp = req.send().await?;
            let status = resp.status();
            let text = resp.text().await.unwrap_or_default();
            println!("submit_status: {}", status);
            println!("submit_response: {}", text);
            Ok(())
        }
        Some(("provision", sub)) => {
            let kp = load_or_generate_keypair()?;
            let secret = sub.get_one::<String>("secret").unwrap();
            let company = sub.get_one::<String>("company").and_then(|s| s.parse::<u32>().ok());
            let token = provision::provision(&bus, &device_id(), &general_purpose::STANDARD.encode(kp.public.as_bytes()), secret, company).await?;
            let _ = save_trust_ack(&token);
            println!("trust_ack: {}", token);
            Ok(())
        }
        Some(("scanner-sim", sub)) => {
            let product = sub.get_one::<String>("product").unwrap();
            let kp = load_or_generate_keypair()?;
            // renew token if needed
            let _ = maybe_renew_token(&bus).await;
            let scan = scanner::simulate_scan(product, &device_id());
            let event = serde_json::json!({
                "productId": scan.product_id,
                "eventType": "QUALITY_CHECK",
                "location": scan.location,
                "timestamp": scan.timestamp,
                "metadata": { "device_id": device_id() }
            });
            let payload = serde_json::to_vec(&event)?;
            let mut h = Sha256::new(); h.update(&payload); let digest = hex::encode(h.finalize());
            let sig: Signature = kp.sign(&payload);
            let client = reqwest::Client::new();
            let mut req = client.post(format!("{}/api/supply-chain/event", bus))
                .header("X-PEA-Device-Id", device_id())
                .header("X-PEA-Public-Key", general_purpose::STANDARD.encode(kp.public.as_bytes()))
                .header("X-PEA-Signature", general_purpose::STANDARD.encode(sig.to_bytes()))
                .header("X-PEA-Payload-Hash", digest)
                .header("X-PEA-Nonce", uuid::Uuid::new_v4().to_string())
                .header("X-PEA-Timestamp", format!("{}", chrono::Utc::now().timestamp_millis()))
                .json(&event)
                .timeout(std::time::Duration::from_secs(15));
            if let Some(tok) = load_trust_ack() { req = req.header("Authorization", format!("Bearer {}", tok)); }
            let resp = req.send().await;
            match resp {
                Ok(r) if r.status().is_success() => {
                    println!("scanner_sim: submitted {}", r.status());
                }
                _ => {
                    println!("scanner_sim: enqueue");
                    queue::enqueue(&format!("{}", product), &payload)?;
                }
            }
            Ok(())
        }
        Some(("scan-serial", sub)) => {
            let port = sub.get_one::<String>("port").unwrap();
            let duration: u64 = sub.get_one::<String>("duration").unwrap().parse().unwrap_or(30);
            let kp = load_or_generate_keypair()?;
            let deadline = std::time::Instant::now() + std::time::Duration::from_secs(duration);
            loop {
                if std::time::Instant::now() > deadline { break; }
                match scanner::serial_backend::poll_serial_once(port) {
                    Ok(Some(code)) => {
                        let scan = scanner::simulate_scan(&code, &device_id());
                        let event = serde_json::json!({
                            "productId": scan.product_id,
                            "eventType": "QUALITY_CHECK",
                            "location": scan.location,
                            "timestamp": scan.timestamp,
                            "metadata": { "device_id": device_id() }
                        });
                        let payload = serde_json::to_vec(&event)?;
                        let mut h = Sha256::new(); h.update(&payload); let digest = hex::encode(h.finalize());
                        let sig: Signature = kp.sign(&payload);
                        let client = reqwest::Client::new();
                        // renew token if needed
                        let _ = maybe_renew_token(&bus).await;
                        let mut req = client.post(format!("{}/api/supply-chain/event", bus))
                            .header("X-PEA-Device-Id", device_id())
                            .header("X-PEA-Public-Key", general_purpose::STANDARD.encode(kp.public.as_bytes()))
                            .header("X-PEA-Signature", general_purpose::STANDARD.encode(sig.to_bytes()))
                            .header("X-PEA-Payload-Hash", digest)
                            .header("X-PEA-Nonce", uuid::Uuid::new_v4().to_string())
                            .header("X-PEA-Timestamp", format!("{}", chrono::Utc::now().timestamp_millis()))
                            .json(&event)
                            .timeout(std::time::Duration::from_secs(15));
                        if let Some(t) = load_trust_ack() { req = req.header("Authorization", format!("Bearer {}", t)); }
                        let resp = req
                            .send().await;
                        match resp {
                            Ok(r) if r.status().is_success() => println!("scan_serial: submitted {}", r.status()),
                            _ => { println!("scan_serial: enqueue"); queue::enqueue(&format!("{}", code), &payload)?; }
                        }
                    }
                    Ok(None) => { /* no data */ }
                    Err(e) => { eprintln!("serial error: {}", e); break; }
                }
                tokio::time::sleep(std::time::Duration::from_millis(200)).await;
            }
            Ok(())
        }
        Some(("scan-hid", sub)) => {
            let kp = load_or_generate_keypair()?;
            let path = sub.get_one::<String>("path").map(|s| s.as_str());
            let vid = sub.get_one::<String>("vid").and_then(|s| u16::from_str_radix(s, 16).ok());
            let pid = sub.get_one::<String>("pid").and_then(|s| u16::from_str_radix(s, 16).ok());
            if let Ok(Some(code)) = scanner::hid_backend::read_once(path, vid, pid) {
                let scan = scanner::simulate_scan(&code, &device_id());
                let event = serde_json::json!({
                    "productId": scan.product_id,
                    "eventType": "QUALITY_CHECK",
                    "location": scan.location,
                    "timestamp": scan.timestamp,
                    "metadata": { "device_id": device_id() }
                });
                let payload = serde_json::to_vec(&event)?;
                let mut h = Sha256::new(); h.update(&payload); let digest = hex::encode(h.finalize());
                let sig: Signature = kp.sign(&payload);
                let client = reqwest::Client::new();
                let mut req = client.post(format!("{}/api/supply-chain/event", bus))
                    .header("X-PEA-Device-Id", device_id())
                    .header("X-PEA-Public-Key", general_purpose::STANDARD.encode(kp.public.as_bytes()))
                    .header("X-PEA-Signature", general_purpose::STANDARD.encode(sig.to_bytes()))
                    .header("X-PEA-Payload-Hash", digest)
                    .header("X-PEA-Nonce", uuid::Uuid::new_v4().to_string())
                    .header("X-PEA-Timestamp", format!("{}", chrono::Utc::now().timestamp_millis()))
                    .json(&event)
                    .timeout(std::time::Duration::from_secs(15));
                if let Some(t) = load_trust_ack() { req = req.header("Authorization", format!("Bearer {}", t)); }
                let resp = req
                    .send().await;
                match resp {
                    Ok(r) if r.status().is_success() => println!("scan_hid: submitted {}", r.status()),
                    _ => { println!("scan_hid: enqueue"); queue::enqueue(&format!("{}", code), &payload)?; }
                }
            } else {
                println!("scan_hid: no data");
            }
            Ok(())
        }
        Some(("queue-drain", _)) => {
            queue::drain(|pt| {
                let bus = bus.clone();
                Box::pin(async move {
                    let client = reqwest::Client::new();
                    // renew token if needed
                    let _ = maybe_renew_token(&bus).await;
                    // reconstruct authenticity for queued plaintext
                    let kp = load_or_generate_keypair()?; // reload keypair for signing queued payloads
                    let mut h = Sha256::new(); h.update(&pt); let digest = hex::encode(h.finalize());
                    use ed25519_dalek::Signer;
                    let sig: Signature = kp.sign(&pt);
                    let mut req = client.post(format!("{}/api/supply-chain/event", bus))
                        .header("X-PEA-Device-Id", device_id())
                        .header("X-PEA-Public-Key", general_purpose::STANDARD.encode(kp.public.as_bytes()))
                        .header("X-PEA-Signature", general_purpose::STANDARD.encode(sig.to_bytes()))
                        .header("X-PEA-Payload-Hash", digest)
                        .header("X-PEA-Nonce", uuid::Uuid::new_v4().to_string())
                        .header("X-PEA-Timestamp", format!("{}", chrono::Utc::now().timestamp_millis()))
                        .header("Content-Type", "application/json");
                    if let Some(t) = load_trust_ack() { req = req.header("Authorization", format!("Bearer {}", t)); }
                    let r = req
                        .body(pt)
                        .timeout(std::time::Duration::from_secs(10))
                        .send().await?;
                    if !r.status().is_success() { return Err(anyhow!("status {}", r.status())); }
                    Ok(())
                })
            }).await?;
            println!("queue: drained");
            Ok(())
        }
        Some(("devices", _)) => {
            let devs = scanner::list_available_devices()?;
            for d in devs { println!("{}", d); }
            Ok(())
        }
        Some(("heartbeat", _)) => {
            let kp = load_or_generate_keypair()?;
            // renew token if needed
            let _ = maybe_renew_token(&bus).await;
            heartbeat::send_heartbeat(&bus, &device_id(), &kp).await?;
            println!("heartbeat: sent");
            Ok(())
        }
        Some(("heartbeat-loop", sub)) => {
            let kp = load_or_generate_keypair()?;
            let interval: u64 = sub.get_one::<String>("interval").unwrap().parse().unwrap_or(3600);
            loop {
                if let Err(e) = heartbeat::send_heartbeat(&bus, &device_id(), &kp).await { eprintln!("heartbeat error: {}", e); }
                tokio::time::sleep(std::time::Duration::from_secs(interval)).await;
            }
        }
        Some(("run", sub)) => {
            let kp = load_or_generate_keypair()?;
            let hb: u64 = sub.get_one::<String>("hb").unwrap().parse().unwrap_or(3600);
            let qd: u64 = sub.get_one::<String>("qd").unwrap().parse().unwrap_or(30);
            let mut hb_next = std::time::Instant::now();
            let mut qd_next = std::time::Instant::now();
            loop {
                let now = std::time::Instant::now();
                if now >= hb_next {
                    let _ = maybe_renew_token(&bus).await;
                    if let Err(e) = heartbeat::send_heartbeat(&bus, &device_id(), &kp).await { eprintln!("heartbeat error: {}", e); }
                    hb_next = now + std::time::Duration::from_secs(hb);
                }
                if now >= qd_next {
                    if let Err(e) = queue::drain(|pt| { let bus = bus.clone(); let tok = load_trust_ack(); Box::pin(async move {
                        let client = reqwest::Client::new();
                        // renew token if needed
                        let _ = maybe_renew_token(&bus).await;
                        let mut req = client.post(format!("{}/api/supply-chain/event", bus))
                            .header("Content-Type", "application/json");
                        if let Some(t) = tok { req = req.header("Authorization", format!("Bearer {}", t)); }
                        let r = req
                            .body(pt)
                            .timeout(std::time::Duration::from_secs(10)).send().await?;
                        if !r.status().is_success() { return Err(anyhow!("status {}", r.status())); }
                        Ok(()) }) }).await { eprintln!("queue drain error: {}", e); }
                    qd_next = now + std::time::Duration::from_secs(qd);
                }
                tokio::time::sleep(std::time::Duration::from_millis(500)).await;
            }
        }
        Some(("reset", sub)) => {
            // Delete device secret and re-provision
            let vault = vault::Vault::with_backend("kmp-pea", "device-ed25519-sk", vault::VaultBackend::OsKeyring);
            let _ = vault.delete_secret();
            // Attempt file fallback delete
            let vault_file = vault::Vault::with_backend("kmp-pea", "device-ed25519-sk", vault::VaultBackend::File);
            let _ = vault_file.delete_secret();
            // Re-provision
            let kp = load_or_generate_keypair()?;
            let secret = sub.get_one::<String>("secret").unwrap();
            let company = sub.get_one::<String>("company").and_then(|s| s.parse::<u32>().ok());
            let token = provision::provision(&bus, &device_id(), &general_purpose::STANDARD.encode(kp.public.as_bytes()), secret, company).await?;
            let _ = save_trust_ack(&token);
            println!("trust_ack: {}", token);
            Ok(())
        }
        Some(("uninstall", _)) => {
            // Wipe keys and queue
            let vault = vault::Vault::with_backend("kmp-pea", "device-ed25519-sk", vault::VaultBackend::OsKeyring);
            let _ = vault.delete_secret();
            let vault_file = vault::Vault::with_backend("kmp-pea", "device-ed25519-sk", vault::VaultBackend::File);
            let _ = vault_file.delete_secret();
            // Remove queue directory files
            // Best-effort: ignore errors
            let _ = std::fs::remove_dir_all(directories::ProjectDirs::from("com","kmp","pea-agent").map(|p| p.data_dir().join("queue")).unwrap_or_else(|| std::path::PathBuf::from("./queue")));
            println!("uninstall: keys and queue wiped");
            Ok(())
        }
        Some(("update-check", _)) => {
            let client = reqwest::Client::new();
            let url = format!("{}/api/updates/pea/latest", bus);
            let resp = client.get(&url).timeout(std::time::Duration::from_secs(10)).send().await?;
            let txt = resp.text().await.unwrap_or_default();
            println!("update_manifest: {}", txt);
            Ok(())
        }
        _ => {
            println!("Use: pea-agent status | pea-agent submit <PRODUCT> [--bus <URL>] [--company <ID>]");
            Ok(())
        }
    }
} 