//! Settings and color-history persistence via tauri-plugin-store.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingsPayload {
    pub hotkey: String,
    pub auto_copy: bool,
    pub theme: String,
}
