use crate::config::Config;
#[cfg(feature = "local-inference")]
use crate::dictation::whisper::LOCAL_WHISPER_MODEL_CONFIG_KEY;
use crate::providers::api_client::{ApiClient, AuthMethod};
use anyhow::Result;
use serde::{Deserialize, Serialize};
#[cfg(feature = "local-inference")]
use std::sync::Mutex;
use std::time::Duration;
use utoipa::ToSchema;

const REQUEST_TIMEOUT: Duration = Duration::from_secs(30);

#[cfg(feature = "local-inference")]
static LOCAL_TRANSCRIBER: once_cell::sync::Lazy<
    Mutex<Option<(String, super::whisper::WhisperTranscriber)>>,
> = once_cell::sync::Lazy::new(|| Mutex::new(None));

#[cfg(feature = "local-inference")]
const WHISPER_TOKENIZER_JSON: &str = include_str!("whisper_data/tokens.json");

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Deserialize, Serialize, ToSchema)]
#[serde(rename_all = "lowercase")]
pub enum DictationProvider {
    OpenAI,
    ElevenLabs,
    Groq,
    Soniox,
    #[cfg(feature = "local-inference")]
    Local,
}

pub struct DictationProviderDef {
    pub provider: DictationProvider,
    pub config_key: &'static str,
    pub default_base_url: &'static str,
    pub endpoint_path: &'static str,
    pub host_key: Option<&'static str>,
    pub description: &'static str,
    pub uses_provider_config: bool,
    pub settings_path: Option<&'static str>,
}

pub const PROVIDERS: &[DictationProviderDef] = &[
    DictationProviderDef {
        provider: DictationProvider::OpenAI,
        config_key: "OPENAI_API_KEY",
        default_base_url: "https://api.openai.com",
        endpoint_path: "v1/audio/transcriptions",
        host_key: Some("OPENAI_HOST"),
        description: "Uses OpenAI Whisper API for high-quality transcription.",
        uses_provider_config: true,
        settings_path: Some("Settings > Models"),
    },
    DictationProviderDef {
        provider: DictationProvider::Groq,
        config_key: "GROQ_API_KEY",
        default_base_url: "https://api.groq.com/openai/v1",
        endpoint_path: "audio/transcriptions",
        host_key: None,
        description: "Uses Groq's ultra-fast Whisper implementation with LPU acceleration.",
        uses_provider_config: false,
        settings_path: None,
    },
    DictationProviderDef {
        provider: DictationProvider::ElevenLabs,
        config_key: "ELEVENLABS_API_KEY",
        default_base_url: "https://api.elevenlabs.io",
        endpoint_path: "v1/speech-to-text",
        host_key: None,
        description: "Uses ElevenLabs speech-to-text API for advanced voice processing.",
        uses_provider_config: false,
        settings_path: None,
    },
    DictationProviderDef {
        provider: DictationProvider::Soniox,
        config_key: "SONIOX_API_KEY",
        default_base_url: "https://api.soniox.com",
        endpoint_path: "v1/speech-to-text",
        host_key: None,
        description: "Ultra-fast streaming speech recognition with high accuracy.",
        uses_provider_config: false,
        settings_path: None,
    },
];

#[cfg(feature = "local-inference")]
pub const LOCAL_PROVIDER_DEF: DictationProviderDef = DictationProviderDef {
    provider: DictationProvider::Local,
    config_key: LOCAL_WHISPER_MODEL_CONFIG_KEY,
    default_base_url: "",
    endpoint_path: "",
    host_key: None,
    description: "Uses local Whisper model for transcription. No API key needed.",
    uses_provider_config: false,
    settings_path: None,
};

/// Returns all provider definitions, including Local when the `local-inference` feature is enabled.
pub fn all_providers() -> Vec<&'static DictationProviderDef> {
    #[cfg(not(feature = "local-inference"))]
    {
        PROVIDERS.iter().collect()
    }
    #[cfg(feature = "local-inference")]
    {
        let mut all: Vec<&DictationProviderDef> = PROVIDERS.iter().collect();
        all.push(&LOCAL_PROVIDER_DEF);
        all
    }
}

pub fn get_provider_def(provider: DictationProvider) -> &'static DictationProviderDef {
    #[cfg(feature = "local-inference")]
    if provider == DictationProvider::Local {
        return &LOCAL_PROVIDER_DEF;
    }
    PROVIDERS
        .iter()
        .find(|def| def.provider == provider)
        .unwrap()
}

pub fn is_configured(provider: DictationProvider) -> bool {
    let config = Config::global();

    match provider {
        #[cfg(feature = "local-inference")]
        DictationProvider::Local => config
            .get(LOCAL_WHISPER_MODEL_CONFIG_KEY, false)
            .ok()
            .and_then(|v| v.as_str().map(|s| s.to_string()))
            .and_then(|id| super::whisper::get_model(&id))
            .is_some_and(|m| m.is_downloaded()),
        _ => {
            let def = get_provider_def(provider);
            config.get_secret::<String>(def.config_key).is_ok()
        }
    }
}

#[cfg(feature = "local-inference")]
pub async fn transcribe_local(audio_bytes: Vec<u8>) -> Result<String> {
    tokio::task::spawn_blocking(move || {
        let config = Config::global();
        let model_id = config
            .get(LOCAL_WHISPER_MODEL_CONFIG_KEY, false)
            .ok()
            .and_then(|v| v.as_str().map(|s| s.to_string()))
            .ok_or_else(|| anyhow::anyhow!("Local Whisper model not configured"))?;

        let model = super::whisper::get_model(&model_id)
            .ok_or_else(|| anyhow::anyhow!("Unknown model: {}", model_id))?;
        let model_path = model.local_path();

        let mut transcriber_lock = LOCAL_TRANSCRIBER
            .lock()
            .map_err(|e| anyhow::anyhow!("Failed to lock transcriber: {}", e))?;

        let model_path_str = model_path.to_string_lossy().to_string();
        let needs_reload = match transcriber_lock.as_ref() {
            None => true,
            Some((cached_path, _)) => cached_path != &model_path_str,
        };

        if needs_reload {
            tracing::info!("Loading Whisper model from: {}", model_path.display());

            let transcriber = super::whisper::WhisperTranscriber::new_with_tokenizer(
                &model_id,
                &model_path,
                WHISPER_TOKENIZER_JSON,
            )?;

            *transcriber_lock = Some((model_path_str, transcriber));
        }

        let (_, transcriber) = transcriber_lock.as_mut().unwrap();
        let text = transcriber.transcribe(&audio_bytes).map_err(|e| {
            tracing::error!("Transcription failed: {}", e);
            e
        })?;

        Ok(text)
    })
    .await
    .map_err(|e| {
        tracing::error!("Transcription task failed: {}", e);
        anyhow::anyhow!(e)
    })?
}

fn build_api_client(provider: DictationProvider) -> Result<ApiClient> {
    let config = Config::global();
    let def = get_provider_def(provider);

    let api_key = config.get_secret(def.config_key).map_err(|e| {
        tracing::error!("{} not configured: {}", def.config_key, e);
        anyhow::anyhow!("{} not configured", def.config_key)
    })?;

    let base_url = if let Some(host_key) = def.host_key {
        config
            .get(host_key, false)
            .ok()
            .and_then(|v| v.as_str().map(|s| s.to_string()))
            .unwrap_or_else(|| def.default_base_url.to_string())
    } else {
        def.default_base_url.to_string()
    };

    let auth = match provider {
        DictationProvider::OpenAI => AuthMethod::BearerToken(api_key),
        DictationProvider::Groq => AuthMethod::BearerToken(api_key),
        DictationProvider::ElevenLabs => AuthMethod::ApiKey {
            header_name: "xi-api-key".to_string(),
            key: api_key,
        },
        DictationProvider::Soniox => AuthMethod::BearerToken(api_key),
        #[cfg(feature = "local-inference")]
        DictationProvider::Local => anyhow::bail!("Local provider should not use API client"),
    };

    ApiClient::with_timeout(base_url, auth, REQUEST_TIMEOUT).map_err(|e| {
        tracing::error!("Failed to create API client: {}", e);
        e
    })
}

const SONIOX_BASE_URL: &str = "https://api.soniox.com";
const SONIOX_MODEL: &str = "stt-async-v5";
const SONIOX_POLL_INTERVAL: Duration = Duration::from_millis(500);
const SONIOX_POLL_TIMEOUT: Duration = Duration::from_secs(60);

/// Transcribe audio using Soniox async speech-to-text API (v2).
/// Flow: upload file → create transcription → poll → get transcript.
pub async fn transcribe_soniox(
    audio_bytes: Vec<u8>,
    mime_type: &str,
    language: Option<&str>,
) -> Result<String> {
    let config = Config::global();
    let api_key = config.get_secret::<String>("SONIOX_API_KEY").map_err(|e| {
        tracing::error!("SONIOX_API_KEY not configured: {}", e);
        anyhow::anyhow!("SONIOX_API_KEY not configured")
    })?;

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(120))
        .build()?;

    let extension = match mime_type {
        "audio/wav" | "audio/x-wav" => "wav",
        "audio/webm" | "audio/webm;codecs=opus" => "webm",
        "audio/mp4" => "mp4",
        "audio/mpeg" | "audio/mpga" => "mp3",
        "audio/m4a" => "m4a",
        _ => "wav",
    };

    // Step 1: Upload audio file
    let part = reqwest::multipart::Part::bytes(audio_bytes)
        .file_name(format!("audio.{}", extension))
        .mime_str(mime_type)
        .map_err(|e| anyhow::anyhow!(e))?;

    let upload_form = reqwest::multipart::Form::new().part("file", part);

    let upload_resp = client
        .post(format!("{}/v1/files", SONIOX_BASE_URL))
        .header("Authorization", format!("Bearer {}", api_key))
        .multipart(upload_form)
        .send()
        .await
        .map_err(|e| {
            tracing::error!("Soniox upload failed: {}", e);
            e
        })?;

    if !upload_resp.status().is_success() {
        let status = upload_resp.status();
        let error_text = upload_resp.text().await.unwrap_or_default();
        if status == 401 || error_text.contains("Invalid API key") {
            anyhow::bail!("Invalid API key");
        } else if status == 429 {
            anyhow::bail!("Rate limit exceeded");
        } else {
            anyhow::bail!("Soniox upload error: {}", error_text);
        }
    }

    let upload_data: serde_json::Value = upload_resp.json().await.map_err(|e| {
        tracing::error!("Failed to parse Soniox upload response: {}", e);
        anyhow::anyhow!(e)
    })?;

    let file_id = upload_data["id"]
        .as_str()
        .ok_or_else(|| anyhow::anyhow!("Missing 'id' field in Soniox upload response"))?;

    // Step 2: Create transcription
    let mut create_body = serde_json::json!({
        "model": SONIOX_MODEL,
        "file_id": file_id,
    });

    if let Some(lang) = language {
        create_body["language"] = serde_json::Value::String(lang.to_string());
    }

    let create_resp = client
        .post(format!("{}/v1/transcriptions", SONIOX_BASE_URL))
        .header("Authorization", format!("Bearer {}", api_key))
        .json(&create_body)
        .send()
        .await
        .map_err(|e| {
            tracing::error!("Soniox create transcription failed: {}", e);
            e
        })?;

    if !create_resp.status().is_success() {
        let error_text = create_resp.text().await.unwrap_or_default();
        anyhow::bail!("Soniox create error: {}", error_text);
    }

    let create_data: serde_json::Value = create_resp.json().await.map_err(|e| {
        tracing::error!("Failed to parse Soniox create response: {}", e);
        anyhow::anyhow!(e)
    })?;

    let transcription_id = create_data["id"]
        .as_str()
        .ok_or_else(|| anyhow::anyhow!("Missing 'id' field in Soniox create response"))?;

    // Step 3: Poll until completed
    let deadline = tokio::time::Instant::now() + SONIOX_POLL_TIMEOUT;
    loop {
        if tokio::time::Instant::now() > deadline {
            anyhow::bail!("Soniox transcription timed out");
        }

        tokio::time::sleep(SONIOX_POLL_INTERVAL).await;

        let status_resp = client
            .get(format!(
                "{}/v1/transcriptions/{}",
                SONIOX_BASE_URL, transcription_id
            ))
            .header("Authorization", format!("Bearer {}", api_key))
            .send()
            .await
            .map_err(|e| {
                tracing::error!("Soniox poll failed: {}", e);
                e
            })?;

        if !status_resp.status().is_success() {
            continue;
        }

        let status_data: serde_json::Value = status_resp.json().await?;

        match status_data["status"].as_str() {
            Some("completed") => break,
            Some("error") | Some("failed") => {
                anyhow::bail!(
                    "Soniox transcription failed: {}",
                    status_data
                        .get("error")
                        .and_then(|e| e.as_str())
                        .unwrap_or("unknown")
                );
            }
            _ => continue,
        }
    }

    // Step 4: Get transcript
    let transcript_resp = client
        .get(format!(
            "{}/v1/transcriptions/{}/transcript",
            SONIOX_BASE_URL, transcription_id
        ))
        .header("Authorization", format!("Bearer {}", api_key))
        .send()
        .await
        .map_err(|e| {
            tracing::error!("Soniox get transcript failed: {}", e);
            e
        })?;

    if !transcript_resp.status().is_success() {
        let error_text = transcript_resp.text().await.unwrap_or_default();
        anyhow::bail!("Soniox transcript error: {}", error_text);
    }

    let transcript_data: serde_json::Value = transcript_resp.json().await.map_err(|e| {
        tracing::error!("Failed to parse Soniox transcript response: {}", e);
        anyhow::anyhow!(e)
    })?;

    let text = transcript_data["text"]
        .as_str()
        .ok_or_else(|| anyhow::anyhow!("Missing 'text' field in Soniox transcript response"))?
        .to_string();

    Ok(text)
}

pub async fn transcribe_with_provider(
    provider: DictationProvider,
    model_param: String,
    model_value: String,
    audio_bytes: Vec<u8>,
    extension: &str,
    mime_type: &str,
    language: Option<&str>,
) -> Result<String> {
    let client = build_api_client(provider)?;
    let def = get_provider_def(provider);

    let part = reqwest::multipart::Part::bytes(audio_bytes)
        .file_name(format!("audio.{}", extension))
        .mime_str(mime_type)
        .map_err(|e| {
            tracing::error!("Failed to create multipart: {}", e);
            anyhow::anyhow!(e)
        })?;

    let mut form = reqwest::multipart::Form::new()
        .part("file", part)
        .text(model_param, model_value);

    if let Some(lang) = language {
        form = form.text("language", lang.to_string());
    }

    let response = client
        .request(None, def.endpoint_path)
        .multipart_post(form)
        .await
        .map_err(|e| {
            tracing::error!("Request failed: {}", e);
            e
        })?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();

        if status == 401 || error_text.contains("Invalid API key") {
            anyhow::bail!("Invalid API key");
        } else if status == 429 || error_text.contains("quota") {
            anyhow::bail!("Rate limit exceeded");
        } else if error_text.contains("too short") {
            return Ok(String::new());
        } else {
            anyhow::bail!("API error: {}", error_text);
        }
    }

    let data: serde_json::Value = response.json().await.map_err(|e| {
        tracing::error!("Failed to parse response: {}", e);
        anyhow::anyhow!(e)
    })?;

    let text = data["text"]
        .as_str()
        .ok_or_else(|| anyhow::anyhow!("Missing 'text' field in response"))?
        .to_string();

    Ok(text)
}
