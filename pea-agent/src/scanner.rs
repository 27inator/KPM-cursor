use anyhow::Result;
use serde::Serialize;

#[derive(Debug, Serialize, Clone)]
pub struct ScanData {
    pub product_id: String,
    pub location: String,
    pub timestamp: String,
}

pub trait Scanner: Send + Sync {
    fn name(&self) -> &str;
    fn poll(&mut self) -> Option<ScanData>;
}

pub struct MockScanner {
    pub location: String,
}
impl MockScanner {
    pub fn new(location: String) -> Self { Self { location } }
}
impl Scanner for MockScanner {
    fn name(&self) -> &str { "mock-scanner" }
    fn poll(&mut self) -> Option<ScanData> { None }
}

pub fn simulate_scan(product_id: &str, location: &str) -> ScanData {
    ScanData { product_id: product_id.to_string(), location: location.to_string(), timestamp: chrono::Utc::now().to_rfc3339() }
}

#[cfg(feature = "scanner-serial")]
pub mod serial_backend {
    use super::*;
    use anyhow::{Result, anyhow};
    use serialport::SerialPort;
    use std::io::Read;
    use std::time::Duration;

    pub fn list_ports() -> Result<Vec<String>> {
        let mut out = Vec::new();
        for p in serialport::available_ports()? { out.push(p.port_name); }
        Ok(out)
    }

    pub fn poll_serial_once(port_name: &str) -> Result<Option<String>> {
        let mut port = serialport::new(port_name, 9600)
            .timeout(Duration::from_millis(300))
            .open()?;
        let mut buf = [0u8; 512];
        match port.read(&mut buf) {
            Ok(n) if n > 0 => {
                let s = String::from_utf8_lossy(&buf[..n]).trim().to_string();
                if !s.is_empty() { Ok(Some(s)) } else { Ok(None) }
            }
            _ => Ok(None),
        }
    }
}

#[cfg(not(feature = "scanner-serial"))]
pub mod serial_backend {
    use super::*;
    use anyhow::Result;
    pub fn list_ports() -> Result<Vec<String>> { Ok(vec![]) }
    pub fn poll_serial_once(_port_name: &str) -> Result<Option<String>> { Ok(None) }
}

#[cfg(feature = "scanner-hid")]
pub mod hid_backend {
    use super::*;
    use anyhow::{Result, anyhow};
    use hidapi::HidApi;
    pub fn list_devices() -> Result<Vec<String>> {
        let api = HidApi::new()?;
        let mut out = Vec::new();
        for d in api.device_list() {
            out.push(format!("{:04x}:{:04x} {}", d.vendor_id(), d.product_id(), d.product_string().unwrap_or("?")));
        }
        Ok(out)
    }
    pub fn read_once(path: Option<&str>, vid: Option<u16>, pid: Option<u16>) -> Result<Option<String>> {
        let api = HidApi::new()?;
        let device = if let Some(p) = path {
            api.open_path(p).map_err(|e| anyhow!("{}", e))?
        } else if let (Some(v), Some(p)) = (vid, pid) {
            api.open(v, p).map_err(|e| anyhow!("{}", e))?
        } else {
            return Ok(None);
        };
        let mut buf = [0u8; 64];
        match device.read_timeout(&mut buf, 200) {
            Ok(n) if n > 0 => {
                let s = String::from_utf8_lossy(&buf[..n]).trim().to_string();
                if s.is_empty() { Ok(None) } else { Ok(Some(s)) }
            }
            _ => Ok(None)
        }
    }
}

#[cfg(not(feature = "scanner-hid"))]
pub mod hid_backend {
    use super::*;
    use anyhow::Result;
    pub fn list_devices() -> Result<Vec<String>> { Ok(vec![]) }
    pub fn read_once(_path: Option<&str>, _vid: Option<u16>, _pid: Option<u16>) -> Result<Option<String>> { Ok(None) }
}

pub fn list_available_devices() -> Result<Vec<String>> {
    let mut devices = Vec::new();
    // Serial
    if let Ok(ports) = serial_backend::list_ports() { for p in ports { devices.push(format!("serial:{}", p)); } }
    // HID
    if let Ok(hids) = hid_backend::list_devices() { for h in hids { devices.push(format!("hid:{}", h)); } }
    Ok(devices)
} 