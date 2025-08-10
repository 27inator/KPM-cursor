#[cfg(feature = "tpm")]
pub mod tpm {
    use anyhow::{Result, anyhow};
    // Placeholder: integrate tss-esapi here when available
    pub fn seal_secret(_data: &[u8]) -> Result<Vec<u8>> {
        Err(anyhow!("TPM seal not implemented yet"))
    }
    pub fn unseal_secret(_blob: &[u8]) -> Result<Vec<u8>> {
        Err(anyhow!("TPM unseal not implemented yet"))
    }
}

#[cfg(not(feature = "tpm"))]
pub mod tpm {
    use anyhow::{Result, anyhow};
    pub fn seal_secret(_data: &[u8]) -> Result<Vec<u8>> { Err(anyhow!("TPM feature not enabled")) }
    pub fn unseal_secret(_blob: &[u8]) -> Result<Vec<u8>> { Err(anyhow!("TPM feature not enabled")) }
} 