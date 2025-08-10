use anyhow::{Result, anyhow};
use keyring::Entry;
use sha2::{Sha256, Digest};
use aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Nonce};
use std::{fs, path::PathBuf};
use directories::ProjectDirs;
use base64::{engine::general_purpose, Engine as _};

#[derive(Clone, Copy)]
pub enum VaultBackend {
    OsKeyring,
    File,
}

pub struct Vault {
    backend: VaultBackend,
    service: String,
    account: String,
}

impl Vault {
    pub fn auto(service: &str, account: &str) -> Self {
        Self { backend: VaultBackend::OsKeyring, service: service.to_string(), account: account.to_string() }
    }

    pub fn with_backend(service: &str, account: &str, backend: VaultBackend) -> Self {
        Self { backend, service: service.to_string(), account: account.to_string() }
    }

    fn file_path(&self) -> Result<PathBuf> {
        let proj = ProjectDirs::from("com","kmp","pea-agent").ok_or_else(|| anyhow!("no project dirs"))?;
        let dir = proj.data_dir().to_path_buf();
        fs::create_dir_all(&dir)?;
        Ok(dir.join(format!("{}.bin", self.account)))
    }

    fn safe_hostname() -> String {
        whoami::fallible::hostname().unwrap_or_else(|_| "unknown-host".to_string())
    }

    fn file_key() -> [u8; 32] {
        let mut h = Sha256::new();
        h.update(Self::safe_hostname());
        h.update(whoami::username());
        let out = h.finalize();
        let mut key = [0u8;32];
        key.copy_from_slice(&out);
        key
    }

    pub fn store_secret(&self, data: &[u8]) -> Result<()> {
        match self.backend {
            VaultBackend::OsKeyring => {
                let entry = Entry::new(&self.service, &self.account)?;
                entry.set_password(&general_purpose::STANDARD.encode(data))?;
                Ok(())
            }
            VaultBackend::File => {
                let key = Self::file_key();
                let cipher = Aes256Gcm::new_from_slice(&key).unwrap();
                let nonce_bytes = rand::random::<[u8;12]>();
                let nonce = Nonce::from_slice(&nonce_bytes);
                let ct = cipher.encrypt(nonce, data).map_err(|_| anyhow!("encrypt failed"))?;
                let mut out = Vec::with_capacity(12 + ct.len());
                out.extend_from_slice(&nonce_bytes);
                out.extend_from_slice(&ct);
                fs::write(self.file_path()?, out)?;
                Ok(())
            }
        }
    }

    pub fn load_secret(&self) -> Result<Vec<u8>> {
        match self.backend {
            VaultBackend::OsKeyring => {
                let entry = Entry::new(&self.service, &self.account)?;
                let val = entry.get_password()?;
                let bytes = general_purpose::STANDARD.decode(val)?;
                Ok(bytes)
            }
            VaultBackend::File => {
                let key = Self::file_key();
                let data = fs::read(self.file_path()?)?;
                let (nonce_bytes, ct) = data.split_at(12);
                let nonce = Nonce::from_slice(nonce_bytes);
                let cipher = Aes256Gcm::new_from_slice(&key).unwrap();
                let pt = cipher.decrypt(nonce, ct).map_err(|_| anyhow!("decrypt failed"))?;
                Ok(pt)
            }
        }
    }

    pub fn delete_secret(&self) -> Result<()> {
        match self.backend {
            VaultBackend::OsKeyring => {
                let entry = Entry::new(&self.service, &self.account)?;
                // keyring crate lacks delete on some platforms; overwrite to empty
                let _ = entry.set_password("");
                Ok(())
            }
            VaultBackend::File => {
                let path = self.file_path()?;
                if path.exists() { let _ = fs::remove_file(path); }
                Ok(())
            }
        }
    }

    pub fn select_backend() -> VaultBackend {
        match std::env::var("PEA_VAULT_BACKEND").ok().as_deref() {
            Some("file") => VaultBackend::File,
            _ => VaultBackend::OsKeyring,
        }
    }

    pub fn load_or_store_secret_auto(service: &str, account: &str, generator: impl Fn() -> Vec<u8>) -> Result<Vec<u8>> {
        let preferred = Self::select_backend();
        let primary = Vault::with_backend(service, account, preferred);
        match primary.load_secret() {
            Ok(bytes) => return Ok(bytes),
            Err(_) => {
                let bytes = generator();
                if primary.store_secret(&bytes).is_ok() {
                    return Ok(bytes);
                }
            }
        }
        let fallback = match preferred { VaultBackend::OsKeyring => VaultBackend::File, VaultBackend::File => VaultBackend::OsKeyring };
        let alt = Vault::with_backend(service, account, fallback);
        match alt.load_secret() {
            Ok(bytes) => Ok(bytes),
            Err(_) => {
                let bytes = generator();
                alt.store_secret(&bytes)?;
                Ok(bytes)
            }
        }
    }
} 