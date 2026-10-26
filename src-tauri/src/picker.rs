//! Screen capture and pixel sampling across multi-monitor setups.
//!
//! All coordinates are in virtual-desktop space (the same space as the
//! `x`/`y` reported by `xcap::Monitor`), so they can be negative on setups
//! where a monitor sits left of or above the primary one.

use serde::Serialize;
use xcap::Monitor;

#[derive(Debug, Clone, Serialize)]
pub struct ColorPayload {
    pub r: u8,
    pub g: u8,
    pub b: u8,
    pub hex: String,
}

impl ColorPayload {
    pub fn from_rgb(r: u8, g: u8, b: u8) -> Self {
        Self { r, g, b, hex: format!("#{r:02X}{g:02X}{b:02X}") }
    }
}

/// A frozen copy of one monitor, shown by the overlay and sampled client-side.
pub struct Snapshot {
    pub width: u32,
    pub height: u32,
    /// Tightly packed RGBA, row-major.
    pub rgba: Vec<u8>,
}

/// Captures the whole monitor that contains the desktop point (`x`, `y`).
pub fn capture_monitor_at(x: i32, y: i32) -> Result<Snapshot, String> {
    let monitor = Monitor::from_point(x, y).map_err(|e| e.to_string())?;
    let img = monitor.capture_image().map_err(|e| e.to_string())?;
    Ok(Snapshot { width: img.width(), height: img.height(), rgba: img.into_raw() })
}

/// Samples the color of the single pixel at (`x`, `y`).
pub fn sample_pixel(x: i32, y: i32) -> Result<ColorPayload, String> {
    let rgba = capture_region(x, y, 1, 1)?;
    // Alpha 0 means no monitor covers this point.
    if rgba[3] == 0 {
        return Err(format!("no monitor at ({x}, {y})"));
    }
    Ok(ColorPayload::from_rgb(rgba[0], rgba[1], rgba[2]))
}

/// Captures a `width` x `height` region as tightly packed RGBA bytes
/// (row-major). Pixels outside every monitor are left as transparent black,
/// so the region may safely straddle monitor edges.
pub fn capture_region(x: i32, y: i32, width: u32, height: u32) -> Result<Vec<u8>, String> {
    if width == 0 || height == 0 {
        return Err("region must be non-empty".into());
    }
    let len = (width as usize)
        .checked_mul(height as usize)
        .and_then(|n| n.checked_mul(4))
        .filter(|&n| n <= 64 * 1024 * 1024)
        .ok_or("region too large")?;
    let mut out = vec![0u8; len];

    let (rx1, ry1) = (x as i64, y as i64);
    let (rx2, ry2) = (rx1 + width as i64, ry1 + height as i64);

    for monitor in Monitor::all().map_err(|e| e.to_string())? {
        let (mx, my) = (monitor.x() as i64, monitor.y() as i64);
        let (mw, mh) = (monitor.width() as i64, monitor.height() as i64);

        // Intersection of the region with this monitor, in desktop space.
        let (ix1, iy1) = (rx1.max(mx), ry1.max(my));
        let (ix2, iy2) = (rx2.min(mx + mw), ry2.min(my + mh));
        if ix1 >= ix2 || iy1 >= iy2 {
            continue;
        }

        let img = monitor.capture_image().map_err(|e| e.to_string())?;
        // The captured bitmap may be in physical pixels while the monitor
        // geometry is logical (DPI scaling); map between the two.
        let sx = img.width() as f64 / mw as f64;
        let sy = img.height() as f64 / mh as f64;

        for py in iy1..iy2 {
            for px in ix1..ix2 {
                let ix = (((px - mx) as f64 * sx) as u32).min(img.width() - 1);
                let iy = (((py - my) as f64 * sy) as u32).min(img.height() - 1);
                let p = img.get_pixel(ix, iy).0;
                let o = (((py - ry1) as usize) * width as usize + (px - rx1) as usize) * 4;
                out[o..o + 4].copy_from_slice(&[p[0], p[1], p[2], 255]);
            }
        }
    }
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hex_is_uppercase_and_zero_padded() {
        assert_eq!(ColorPayload::from_rgb(59, 130, 246).hex, "#3B82F6");
        assert_eq!(ColorPayload::from_rgb(0, 0, 5).hex, "#000005");
    }

    #[test]
    fn rejects_empty_region() {
        assert!(capture_region(0, 0, 0, 5).is_err());
    }
}

#[cfg(test)]
mod live_tests {
    use super::*;

    /// Needs a real display: `cargo test -- --ignored`.
    #[test]
    #[ignore]
    fn samples_primary_monitor() {
        let c = sample_pixel(10, 10).expect("pixel");
        println!("{c:?}");
        assert_eq!(capture_region(0, 0, 15, 15).unwrap().len(), 15 * 15 * 4);
    }
}
