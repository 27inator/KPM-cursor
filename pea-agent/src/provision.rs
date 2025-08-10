use anyhow::{Result, anyhow};
use serde::Serialize;
use sha2::{Sha256, Digest};
use base64::{engine::general_purpose, Engine as _};

fn stable_stringify(v: &serde_json::Value) -> String {
    match v {
        serde_json::Value::Null | serde_json::Value::Bool(_) | serde_json::Value::Number(_) | serde_json::Value::String(_) => v.to_string(),
        serde_json::Value::Array(a) => {
            let parts: Vec<String> = a.iter().map(stable_stringify).collect();
            format!("[{}]", parts.join(","))
        }
        serde_json::Value::Object(map) => {
            let mut keys: Vec<&String> = map.keys().collect();
            keys.sort();
            let parts: Vec<String> = keys.iter().map(|k| format!("\"{}\":{}", k, stable_stringify(&map[*k]))).collect();
            format!("{{{}}}", parts.join(","))
        }
    }
}

fn hmac(dev_secret: &str, body: &serde_json::Value, nonce: &str, ts: &str) -> String {
    use hmac::{Hmac, Mac};
    type HmacSha256 = Hmac<sha2::Sha256>;
    let mut mac = HmacSha256::new_from_slice(dev_secret.as_bytes()).unwrap();
    mac.update(format!("{}|{}|{}", stable_stringify(body), nonce, ts).as_bytes());
    hex::encode(mac.finalize().into_bytes())
}

pub async fn provision(bus: &str, device_id: &str, public_key_b64: &str, secret: &str, company_id: Option<u32>) -> Result<String> {
    let body = serde_json::json!({
        "device_id": device_id,
        "public_key_b64": public_key_b64,
        "metadata": {"platform": std::env::consts::OS}
    });
    let nonce = uuid::Uuid::new_v4().to_string();
    let ts = format!("{}", chrono::Utc::now().timestamp_millis());
    let sig = hmac(secret, &body, &nonce, &ts);
    let client = reqwest::Client::new();
    let mut req = client.post(format!("{}/api/provisioning/register", bus))
        .header("X-PEA-Nonce", &nonce)
        .header("X-PEA-Timestamp", &ts)
        .header("X-PEA-HMAC", &sig)
        .json(&body);
    if let Some(cid) = company_id { req = req.header("X-Company-Id", format!("{}", cid)); }
    let resp = req.send().await?;
    if !resp.status().is_success() { return Err(anyhow!("status {}", resp.status())); }
    let v: serde_json::Value = resp.json().await?;
    Ok(v.get("trust_ack").and_then(|x| x.as_str()).unwrap_or("").to_string())
} 