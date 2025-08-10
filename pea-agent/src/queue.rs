use anyhow::{Result, anyhow};
use directories::ProjectDirs;
use std::{fs, path::PathBuf, time::Duration};
use aes_gcm::{Aes256Gcm, Nonce};
use aead::{Aead, KeyInit};
use sha2::{Sha256, Digest};

fn queue_dir() -> Result<PathBuf> {
    let proj = ProjectDirs::from("com","kmp","pea-agent").ok_or_else(|| anyhow!("no project dirs"))?;
    let dir = proj.data_dir().join("queue");
    fs::create_dir_all(&dir)?;
    Ok(dir)
}

fn key() -> [u8;32] {
    let mut h = Sha256::new();
    h.update(whoami::hostname()); h.update(whoami::username());
    let out = h.finalize(); let mut k=[0u8;32]; k.copy_from_slice(&out); k
}

pub fn enqueue(name: &str, data: &[u8]) -> Result<()> {
    let dir = queue_dir()?;
    let mut nonce_bytes = rand::random::<[u8;12]>();
    let cipher = Aes256Gcm::new_from_slice(&key()).unwrap();
    let nonce = Nonce::from_slice(&nonce_bytes);
    let ct = cipher.encrypt(nonce, data).map_err(|_| anyhow!("encrypt failed"))?;
    let mut out = Vec::with_capacity(12+ct.len());
    out.extend_from_slice(&nonce_bytes);
    out.extend_from_slice(&ct);
    fs::write(dir.join(format!("{}.bin", name)), out)?;
    Ok(())
}

pub async fn drain<F>(mut submit: F) -> Result<()>
where F: FnMut(Vec<u8>) -> std::pin::Pin<Box<dyn std::future::Future<Output=Result<()>> + Send>> {
    let dir = queue_dir()?;
    let entries = fs::read_dir(&dir)?;
    for ent in entries {
        let ent = ent?; let path = ent.path();
        if path.extension().and_then(|s| s.to_str()) != Some("bin") { continue; }
        let data = fs::read(&path)?; let (nonce_bytes, ct) = data.split_at(12);
        let nonce = Nonce::from_slice(nonce_bytes);
        let cipher = Aes256Gcm::new_from_slice(&key()).unwrap();
        match cipher.decrypt(nonce, ct) {
            Ok(pt) => {
                if let Err(e) = submit(pt).await {
                    eprintln!("queue submit error: {}", e);
                    // backoff simple sleep
                    tokio::time::sleep(Duration::from_secs(2)).await;
                    continue;
                }
                let _ = fs::remove_file(&path);
            }
            Err(_) => {
                eprintln!("queue decrypt error for {:?}", path);
            }
        }
    }
    Ok(())
}

pub fn stats() -> Result<(usize, usize)> {
    let dir = queue_dir()?;
    let mut count = 0usize; let mut bytes = 0usize;
    for ent in fs::read_dir(&dir)? { let ent = ent?; let p = ent.path(); if p.extension().and_then(|s| s.to_str())==Some("bin"){ count+=1; bytes+=fs::metadata(p)?.len() as usize; } }
    Ok((count, bytes))
}

pub fn prune_by_age(days: u64) -> Result<()> {
    use std::time::{SystemTime, Duration};
    let dir = queue_dir()?; let cutoff = SystemTime::now() - Duration::from_secs(days*24*3600);
    for ent in fs::read_dir(&dir)? { let ent = ent?; let p = ent.path(); if p.extension().and_then(|s| s.to_str())!=Some("bin"){continue;} let md = fs::metadata(&p)?; if let Ok(m) = md.modified(){ if m < cutoff { let _=fs::remove_file(&p); } } }
    Ok(())
} 