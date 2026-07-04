use crate::config::paths::Paths;
use anyhow::{anyhow, Result};
use fs_err::File;
use goose_providers::errors::{GoogleErrorCode, ProviderError};
use goose_providers::request_log::{install_logger, RequestLogHandle, RequestLogger};
use reqwest::{Response, StatusCode};
use serde_json::Value;
use std::error::Error;
use std::io::{BufWriter, Write};
use std::path::PathBuf;
use std::sync::OnceLock;
use std::time::Duration;
use uuid::Uuid;

<<<<<<< HEAD
#[derive(Debug, Copy, Clone, Serialize, Deserialize)]
pub enum ImageFormat {
    /// Real OpenAI API — supports the `{"type": "file"}` format for PDFs.
    OpenAi,
    /// OpenAI-compatible providers (e.g. Qwen, Mistral, Groq) that only accept
    /// `image_url` for vision and do not understand the `file` content block.
    /// PDFs are replaced with a text placeholder so the request does not 400.
    OpenAiCompat,
    Anthropic,
}

/// Convert an image content into an image json based on format
pub fn convert_image(image: &ImageContent, image_format: &ImageFormat) -> Value {
    let is_pdf = image.mime_type == "application/pdf";
    match image_format {
        ImageFormat::OpenAi => {
            if is_pdf {
                json!({
                    "type": "file",
                    "file": {
                        "filename": "document.pdf",
                        "file_data": format!("data:{};base64,{}", image.mime_type, image.data)
                    }
                })
            } else {
                json!({
                    "type": "image_url",
                    "image_url": {
                        "url": format!("data:{};base64,{}", image.mime_type, image.data)
                    }
                })
            }
        }
        ImageFormat::OpenAiCompat => {
            if is_pdf {
                // Most OpenAI-compatible providers do not support the `file` content
                // block that real OpenAI added for PDFs.  Sending it causes a 400.
                // Fall back to a text note so the request succeeds; the user can
                // share the file path and the agent can read it via file tools.
                json!({
                    "type": "text",
                    "text": "[A PDF was attached but this provider does not support binary PDF uploads. \
                              Share the file path in your message so the agent can read it with file tools.]"
                })
            } else {
                json!({
                    "type": "image_url",
                    "image_url": {
                        "url": format!("data:{};base64,{}", image.mime_type, image.data)
                    }
                })
            }
        }
        ImageFormat::Anthropic => {
            if is_pdf {
                json!({
                    "type": "document",
                    "source": {
                        "type": "base64",
                        "media_type": image.mime_type,
                        "data": image.data,
                    }
                })
            } else {
                json!({
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": image.mime_type,
                        "data": image.data,
                    }
                })
            }
        }
    }
}

=======
>>>>>>> a0aed81f36076cfe48def4b21c04d7f0d33072e8
pub fn filter_extensions_from_system_prompt(system: &str) -> String {
    let Some(extensions_start) = system.find("# Extensions") else {
        return system.to_string();
    };

    let Some(after_extensions) = system.get(extensions_start + 1..) else {
        return system.to_string();
    };

    if let Some(next_section_pos) = after_extensions.find("\n# ") {
        let Some(before) = system.get(..extensions_start) else {
            return system.to_string();
        };
        let Some(after) = system.get(extensions_start + next_section_pos + 1..) else {
            return system.to_string();
        };
        format!("{}{}", before.trim_end(), after)
    } else {
        system
            .get(..extensions_start)
            .map(|s| s.trim_end().to_string())
            .unwrap_or_else(|| system.to_string())
    }
}

fn format_server_error_message(status_code: StatusCode, payload: Option<&Value>) -> String {
    match payload {
        Some(Value::Null) | None => format!(
            "HTTP {}: No response body received from server",
            status_code.as_u16()
        ),
        Some(p) => format!("HTTP {}: {}", status_code.as_u16(), p),
    }
}

pub fn is_google_model(payload: &Value) -> bool {
    payload
        .get("model")
        .and_then(|m| m.as_str())
        .unwrap_or("")
        .to_lowercase()
        .contains("google")
}

/// Extracts `StatusCode` from response status or payload error code.
/// This function first checks the status code of the response. If the status is successful (2xx),
/// it then checks the payload for any error codes and maps them to appropriate `StatusCode`.
/// If the status is not successful (e.g., 4xx or 5xx), the original status code is returned.
fn get_google_final_status(status: StatusCode, payload: Option<&Value>) -> StatusCode {
    // If the status is successful, check for an error in the payload
    if status.is_success() {
        if let Some(payload) = payload {
            if let Some(error) = payload.get("error") {
                if let Some(code) = error.get("code").and_then(|c| c.as_u64()) {
                    if let Some(google_error) = GoogleErrorCode::from_code(code) {
                        return google_error.to_status_code();
                    }
                }
            }
        }
    }
    status
}

fn parse_google_retry_delay(payload: &Value) -> Option<Duration> {
    payload
        .get("error")
        .and_then(|error| error.get("details"))
        .and_then(|details| details.as_array())
        .and_then(|details_array| {
            details_array.iter().find_map(|detail| {
                if detail
                    .get("@type")
                    .and_then(|t| t.as_str())
                    .is_some_and(|s| s.ends_with("RetryInfo"))
                {
                    detail
                        .get("retryDelay")
                        .and_then(|delay| delay.as_str())
                        .and_then(|s| s.strip_suffix('s'))
                        .and_then(|num| num.parse::<u64>().ok())
                        .map(Duration::from_secs)
                } else {
                    None
                }
            })
        })
}

/// Handle response from Google Gemini API-compatible endpoints.
///
/// Processes HTTP responses, handling specific statuses and parsing the payload
/// for error messages. Logs the response payload for debugging purposes.
///
/// ### References
/// - Error Codes: https://ai.google.dev/gemini-api/docs/troubleshooting?lang=python
///
/// ### Arguments
/// - `response`: The HTTP response to process.
///
/// ### Returns
/// - `Ok(Value)`: Parsed JSON on success.
/// - `Err(ProviderError)`: Describes the failure reason.
pub async fn handle_response_google_compat(response: Response) -> Result<Value, ProviderError> {
    let status = response.status();
    let url = super::http_status::sanitize_url(response.url().as_str());
    let payload: Option<Value> = response.json().await.ok();
    let final_status = get_google_final_status(status, payload.as_ref());

    match final_status {
        StatusCode::OK => payload.ok_or_else(|| {
            ProviderError::RequestFailed("Response body is not valid JSON".to_string())
        }),
        StatusCode::UNAUTHORIZED | StatusCode::FORBIDDEN => {
<<<<<<< HEAD
            Err(ProviderError::Authentication(format!(
                "Authentication failed. Please ensure your API keys are valid and have the required permissions. \
                Status: {}. Response: {:?}",
                final_status, payload
            )))
=======
            Err(ProviderError::Authentication(format!("Authentication failed for {url}. Please ensure your API keys are valid and have the required permissions. \
                Status: {}. Response: {:?}", final_status, payload )))
>>>>>>> a0aed81f36076cfe48def4b21c04d7f0d33072e8
        }
        StatusCode::BAD_REQUEST | StatusCode::NOT_FOUND => {
            let mut error_msg = "Unknown error".to_string();
            if let Some(payload) = &payload {
                if let Some(error) = payload.get("error") {
<<<<<<< HEAD
                    error_msg = error
                        .get("message")
                        .and_then(|m| m.as_str())
                        .unwrap_or("Unknown error")
                        .to_string();
                    let error_status = error
                        .get("status")
                        .and_then(|s| s.as_str())
                        .unwrap_or("Unknown status");
                    if error_status == "INVALID_ARGUMENT"
                        && error_msg.to_lowercase().contains("exceeds")
=======
                    error_msg = error.get("message").and_then(|m| m.as_str()).unwrap_or("Unknown error").to_string();
                    let error_status = error.get("status").and_then(|s| s.as_str()).unwrap_or("Unknown status");
                    if error_status == "INVALID_ARGUMENT"
                        && goose_providers::http_status::is_context_length_exceeded_message(&error_msg)
>>>>>>> a0aed81f36076cfe48def4b21c04d7f0d33072e8
                    {
                        return Err(ProviderError::ContextLengthExceeded(error_msg.to_string()));
                    }
                }
            }
            tracing::debug!(
                "{}",
                format!(
                    "Provider request failed with status: {}. Payload: {:?}",
                    final_status, payload
                )
            );
<<<<<<< HEAD
            Err(ProviderError::RequestFailed(format!(
                "Request failed with status: {}. Message: {}",
                final_status, error_msg
            )))
=======
            Err(ProviderError::RequestFailed(format!("Request failed with status {} at {url}. Message: {}", final_status, error_msg)))
>>>>>>> a0aed81f36076cfe48def4b21c04d7f0d33072e8
        }
        StatusCode::TOO_MANY_REQUESTS => {
            let retry_delay = payload.as_ref().and_then(parse_google_retry_delay);
            Err(ProviderError::RateLimitExceeded {
                details: format!("{:?}", payload),
                retry_delay,
            })
        }
        _ if final_status.is_server_error() => Err(ProviderError::ServerError(
            format!("Server error ({}) at {url}: {}", final_status, format_server_error_message(final_status, payload.as_ref())),
        )),
        _ => {
            tracing::debug!(
                "{}",
                format!(
                    "Provider request failed with status: {}. Payload: {:?}",
                    final_status, payload
                )
            );
<<<<<<< HEAD
            Err(ProviderError::RequestFailed(format!(
                "Request failed with status: {}",
                final_status
            )))
=======
            Err(ProviderError::RequestFailed(format!("Request failed with status {} at {url}", final_status)))
>>>>>>> a0aed81f36076cfe48def4b21c04d7f0d33072e8
        }
    }
}

/// Extract the model name from a JSON object. Common with most providers to have this top level attribute.
pub fn get_model(data: &Value) -> String {
    if let Some(model) = data.get("model") {
        if let Some(model_str) = model.as_str() {
            model_str.to_string()
        } else {
            "Unknown".to_string()
        }
    } else {
        "Unknown".to_string()
    }
}

<<<<<<< HEAD
fn is_media_file(path: &Path) -> bool {
    if let Ok(mut file) = std::fs::File::open(path) {
        let mut buffer = [0u8; 12];
        if file.read(&mut buffer).is_ok() {
            return match &buffer[0..4] {
                [0x89, 0x50, 0x4E, 0x47] => true,
                [0xFF, 0xD8, 0xFF, _] => true,
                [0x47, 0x49, 0x46, 0x38] => true,
                [0x42, 0x4D, _, _] => true,
                [0x52, 0x49, 0x46, 0x46] => buffer.len() >= 12 && &buffer[8..12] == b"WEBP",
                [0x49, 0x49, 0x2A, 0x00] => true,
                [0x4D, 0x4D, 0x00, 0x2A] => true,
                [0x25, 0x50, 0x44, 0x46] => true,
                _ => {
                    buffer.len() >= 12
                        && &buffer[4..8] == b"ftyp"
                        && matches!(
                            &buffer[8..12],
                            b"heic" | b"heix" | b"heim" | b"heis" | b"mif1"
                        )
                }
            };
        }
    }
    false
}

#[allow(clippy::string_slice)] // Slicing on ASCII '"' boundaries from str::find; always valid UTF-8
pub fn detect_image_path(text: &str) -> Option<String> {
    let extensions = [
        ".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".tiff", ".tif", ".heic", ".heif",
        ".svg", ".pdf",
    ];

    // First, try to find quoted paths e.g. [image: "/path/with spaces/file.png"]
    let mut search = text;
    while let Some(quote_start) = search.find('"') {
        let after_quote = &search[quote_start + 1..];
        if let Some(quote_end) = after_quote.find('"') {
            let candidate = &after_quote[..quote_end];
            if extensions
                .iter()
                .any(|ext| candidate.to_lowercase().ends_with(ext))
            {
                let path = Path::new(candidate);
                if path.is_absolute() && path.is_file() && is_media_file(path) {
                    return Some(candidate.to_string());
                }
            }
            search = &after_quote[quote_end + 1..];
        } else {
            break;
        }
    }

    // Fall back: find any whitespace-delimited word ending with an image extension
    for word in text.split_whitespace() {
        if extensions
            .iter()
            .any(|ext| word.to_lowercase().ends_with(ext))
        {
            let path = Path::new(word);
            if path.is_absolute() && path.is_file() && is_media_file(path) {
                return Some(word.to_string());
            }
        }
    }
    None
}

pub fn load_image_file(path: &str) -> Result<ImageContent, ProviderError> {
    let path = Path::new(path);

    if !is_media_file(path) {
        return Err(ProviderError::RequestFailed(
            "File is not a valid image or document".to_string(),
        ));
    }

    let bytes = std::fs::read(path)
        .map_err(|e| ProviderError::RequestFailed(format!("Failed to read image file: {}", e)))?;

    let mime_type = match path.extension().and_then(|e| e.to_str()) {
        Some(ext) => match ext.to_lowercase().as_str() {
            "png" => "image/png",
            "jpg" | "jpeg" => "image/jpeg",
            "gif" => "image/gif",
            "webp" => "image/webp",
            "bmp" => "image/bmp",
            "tiff" | "tif" => "image/tiff",
            "heic" | "heif" => "image/heic",
            "svg" => "image/svg+xml",
            "pdf" => "application/pdf",
            _ => {
                return Err(ProviderError::RequestFailed(
                    "Unsupported image format".to_string(),
                ));
            }
        },
        None => {
            return Err(ProviderError::RequestFailed(
                "Unknown image format".to_string(),
            ));
        }
    };

    let data = base64::prelude::BASE64_STANDARD.encode(&bytes);

    Ok(RawImageContent {
        mime_type: mime_type.to_string(),
        data,
        meta: None,
    }
    .no_annotation())
}

=======
>>>>>>> a0aed81f36076cfe48def4b21c04d7f0d33072e8
pub fn unescape_json_values(value: &Value) -> Value {
    let mut cloned = value.clone();
    unescape_json_values_in_place(&mut cloned);
    cloned
}

fn unescape_json_values_in_place(value: &mut Value) {
    match value {
        Value::Object(map) => {
            for v in map.values_mut() {
                unescape_json_values_in_place(v);
            }
        }
        Value::Array(arr) => {
            for v in arr.iter_mut() {
                unescape_json_values_in_place(v);
            }
        }
        Value::String(s) => {
            if s.contains('\\') {
                *s = s
                    .replace("\\\\n", "\n")
                    .replace("\\\\t", "\t")
                    .replace("\\\\r", "\r")
                    .replace("\\\\\"", "\"")
                    .replace("\\n", "\n")
                    .replace("\\t", "\t")
                    .replace("\\r", "\r")
                    .replace("\\\"", "\"");
            }
        }
        _ => {}
    }
}

pub const LOGS_TO_KEEP: usize = 10;

static INIT_LOGGER: OnceLock<Result<()>> = OnceLock::new();

pub fn init_goose_request_log() -> Result<()> {
    INIT_LOGGER
        .get_or_init(|| Ok(install_logger(RequestLog::new(LOGS_TO_KEEP)?)?))
        .as_ref()
        .map_err(|e| anyhow::anyhow!("failed to set up logger: {}", e))?;
    Ok(())
}

pub struct RequestLog {
    logs_to_keep: usize,
}

impl RequestLog {
    pub fn new(logs_to_keep: usize) -> Result<Self> {
        let logs_dir = Paths::in_state_dir("logs");
        fs_err::create_dir_all(&logs_dir)?;
        Ok(Self { logs_to_keep })
    }
}

struct FileLogHandle {
    writer: Option<BufWriter<File>>,
    temp_path: PathBuf,
    logs_to_keep: usize,
}

impl RequestLogger for RequestLog {
    fn start(&self) -> Result<Box<dyn RequestLogHandle>, Box<dyn Error + Send + Sync>> {
        let logs_dir = Paths::in_state_dir("logs");
        fs_err::create_dir_all(&logs_dir)?;

        let request_id = Uuid::new_v4();
        let temp_name = format!("llm_request.{request_id}.jsonl");
        let temp_path = logs_dir.join(PathBuf::from(temp_name));

        let writer = BufWriter::new(
            File::options()
                .write(true)
                .create(true)
                .truncate(true)
                .open(&temp_path)?,
        );

        Ok(Box::new(FileLogHandle {
            writer: Some(writer),
            temp_path,
            logs_to_keep: self.logs_to_keep,
        }))
    }
}

impl RequestLogHandle for FileLogHandle {
    fn write(&mut self, s: &str) -> Result<(), Box<dyn Error + Send + Sync>> {
        let writer = self
            .writer
            .as_mut()
            .ok_or_else(|| anyhow!("logger is finished"))?;
        writeln!(writer, "{}", s)?;
        Ok(())
    }
}

impl FileLogHandle {
    fn finish(&mut self) -> Result<()> {
        if let Some(mut writer) = self.writer.take() {
            writer.flush()?;
            let logs_dir = Paths::in_state_dir("logs");
            let log_path = |i| logs_dir.join(format!("llm_request.{}.jsonl", i));

            if self.logs_to_keep == 0 {
                fs_err::remove_file(&self.temp_path)?;
                return Ok(());
            }

            for i in (0..self.logs_to_keep.saturating_sub(1)).rev() {
                let _ = fs_err::rename(log_path(i), log_path(i + 1));
            }

            fs_err::rename(&self.temp_path, log_path(0))?;
        }
        Ok(())
    }
}

impl Drop for FileLogHandle {
    fn drop(&mut self) {
        if std::thread::panicking() {
            return;
        }
        let _ = self.finish();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
<<<<<<< HEAD
    fn test_request_log_start_creates_logs_dir() {
        let _guard = env_lock::lock_env([("GOOSE_PATH_ROOT", None::<&str>)]);
        let temp_dir = tempfile::tempdir().unwrap();
        std::env::set_var("GOOSE_PATH_ROOT", temp_dir.path());

        let logs_dir = Paths::in_state_dir("logs");
        assert!(!logs_dir.exists(), "logs dir should not exist yet");

        let log = RequestLog::start(
            &ModelConfig::new("test").unwrap(),
            &json!({"model": "test"}),
        )
        .expect("RequestLog::start should create missing logs dir");
        drop(log);

        assert!(logs_dir.is_dir(), "logs dir should have been created");

        std::env::remove_var("GOOSE_PATH_ROOT");
    }

    #[test]
    fn test_detect_image_path() {
        // Create a temporary PNG file with valid PNG magic numbers
        let temp_dir = tempfile::tempdir().unwrap();
        let png_path = temp_dir.path().join("test.png");
        let png_data = [
            0x89, 0x50, 0x4E, 0x47, // PNG magic number
            0x0D, 0x0A, 0x1A, 0x0A, // PNG header
            0x00, 0x00, 0x00, 0x0D, // Rest of fake PNG data
        ];
        std::fs::write(&png_path, png_data).unwrap();
        let png_path_str = png_path.to_str().unwrap();

        // Create a fake PNG (wrong magic numbers)
        let fake_png_path = temp_dir.path().join("fake.png");
        std::fs::write(&fake_png_path, b"not a real png").unwrap();

        // Test with valid PNG file using absolute path
        let text = format!("Here is an image {}", png_path_str);
        assert_eq!(detect_image_path(&text).as_deref(), Some(png_path_str));

        // Test with non-image file that has .png extension
        let text = format!("Here is a fake image {}", fake_png_path.to_str().unwrap());
        assert_eq!(detect_image_path(&text), None);

        // Test with nonexistent file
        let text = "Here is a fake.png that doesn't exist";
        assert_eq!(detect_image_path(text), None);

        // Test with non-image file
        let text = "Here is a file.txt";
        assert_eq!(detect_image_path(text), None);

        // Test with relative path (should not match)
        let text = "Here is a relative/path/image.png";
        assert_eq!(detect_image_path(text), None);

        let webp_path = temp_dir.path().join("test.webp");
        let mut webp_data = vec![0x52, 0x49, 0x46, 0x46];
        webp_data.extend_from_slice(&[0x0A, 0x00, 0x00, 0x00]);
        webp_data.extend_from_slice(b"WEBP");
        std::fs::write(&webp_path, &webp_data).unwrap();
        let webp_path_str = webp_path.to_str().unwrap();

        let text = format!("Here is a webp image {}", webp_path_str);
        assert_eq!(detect_image_path(&text).as_deref(), Some(webp_path_str));

        let pdf_path = temp_dir.path().join("test.pdf");
        let mut pdf_data = vec![0x25, 0x50, 0x44, 0x46];
        pdf_data.extend_from_slice(b"-1.4 test content");
        std::fs::write(&pdf_path, &pdf_data).unwrap();
        let pdf_path_str = pdf_path.to_str().unwrap();

        let text = format!("Check this PDF {}", pdf_path_str);
        assert_eq!(detect_image_path(&text).as_deref(), Some(pdf_path_str));
    }

    #[test]
    fn test_load_image_file() {
        // Create a temporary PNG file with valid PNG magic numbers
        let temp_dir = tempfile::tempdir().unwrap();
        let png_path = temp_dir.path().join("test.png");
        let png_data = [
            0x89, 0x50, 0x4E, 0x47, // PNG magic number
            0x0D, 0x0A, 0x1A, 0x0A, // PNG header
            0x00, 0x00, 0x00, 0x0D, // Rest of fake PNG data
        ];
        std::fs::write(&png_path, png_data).unwrap();
        let png_path_str = png_path.to_str().unwrap();

        // Create a fake PNG (wrong magic numbers)
        let fake_png_path = temp_dir.path().join("fake.png");
        std::fs::write(&fake_png_path, b"not a real png").unwrap();
        let fake_png_path_str = fake_png_path.to_str().unwrap();

        // Test loading valid PNG file
        let result = load_image_file(png_path_str);
        assert!(result.is_ok());
        let image = result.unwrap();
        assert_eq!(image.mime_type, "image/png");

        // Test loading fake PNG file
        let result = load_image_file(fake_png_path_str);
        assert!(result.is_err());
        assert!(result
            .unwrap_err()
            .to_string()
            .contains("not a valid image"));

        // Test nonexistent file
        let result = load_image_file("nonexistent.png");
        assert!(result.is_err());

        // Create a GIF file with valid header bytes
        let gif_path = temp_dir.path().join("test.gif");
        // Minimal GIF89a header
        let gif_data = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61];
        std::fs::write(&gif_path, gif_data).unwrap();
        let gif_path_str = gif_path.to_str().unwrap();

        let result = load_image_file(gif_path_str);
        assert!(result.is_ok());
        let image = result.unwrap();
        assert_eq!(image.mime_type, "image/gif");

        let webp_path = temp_dir.path().join("test.webp");
        let mut webp_data = vec![0x52, 0x49, 0x46, 0x46];
        webp_data.extend_from_slice(&[0x0A, 0x00, 0x00, 0x00]);
        webp_data.extend_from_slice(b"WEBP");
        std::fs::write(&webp_path, webp_data).unwrap();
        let webp_path_str = webp_path.to_str().unwrap();

        let result = load_image_file(webp_path_str);
        assert!(result.is_ok());
        let image = result.unwrap();
        assert_eq!(image.mime_type, "image/webp");

        let xyz_path = temp_dir.path().join("test.xyz");
        std::fs::write(&xyz_path, png_data).unwrap();
        let result = load_image_file(xyz_path.to_str().unwrap());
        assert!(result.is_err());
        assert!(result
            .unwrap_err()
            .to_string()
            .contains("Unsupported image format"));

        let pdf_path = temp_dir.path().join("test.pdf");
        let mut pdf_data = vec![0x25, 0x50, 0x44, 0x46];
        pdf_data.extend_from_slice(b"-1.4 test pdf content");
        std::fs::write(&pdf_path, &pdf_data).unwrap();
        let pdf_path_str = pdf_path.to_str().unwrap();

        let result = load_image_file(pdf_path_str);
        assert!(result.is_ok());
        let doc = result.unwrap();
        assert_eq!(doc.mime_type, "application/pdf");
    }

    #[test]
    fn test_sanitize_function_name() {
        assert_eq!(sanitize_function_name("hello-world"), "hello-world");
        assert_eq!(sanitize_function_name("hello world"), "hello_world");
        assert_eq!(sanitize_function_name("hello@world"), "hello_world");
    }

    #[test]
    fn test_is_valid_function_name() {
        assert!(is_valid_function_name("hello-world"));
        assert!(is_valid_function_name("hello_world"));
        assert!(!is_valid_function_name("hello world"));
        assert!(!is_valid_function_name("hello@world"));
    }

    #[test]
=======
>>>>>>> a0aed81f36076cfe48def4b21c04d7f0d33072e8
    fn unescape_json_values_with_object() {
        let value = json!({"text": "Hello\\nWorld"});
        let unescaped_value = unescape_json_values(&value);
        assert_eq!(unescaped_value, json!({"text": "Hello\nWorld"}));
    }

    #[test]
    fn unescape_json_values_with_array() {
        let value = json!(["Hello\\nWorld", "Goodbye\\tWorld"]);
        let unescaped_value = unescape_json_values(&value);
        assert_eq!(unescaped_value, json!(["Hello\nWorld", "Goodbye\tWorld"]));
    }

    #[test]
    fn unescape_json_values_with_string() {
        let value = json!("Hello\\nWorld");
        let unescaped_value = unescape_json_values(&value);
        assert_eq!(unescaped_value, json!("Hello\nWorld"));
    }

    #[test]
    fn unescape_json_values_with_mixed_content() {
        let value = json!({
            "text": "Hello\\nWorld\\\\n!",
            "array": ["Goodbye\\tWorld", "See you\\rlater"],
            "nested": {
                "inner_text": "Inner\\\"Quote\\\""
            }
        });
        let unescaped_value = unescape_json_values(&value);
        assert_eq!(
            unescaped_value,
            json!({
                "text": "Hello\nWorld\n!",
                "array": ["Goodbye\tWorld", "See you\rlater"],
                "nested": {
                    "inner_text": "Inner\"Quote\""
                }
            })
        );
    }

    #[test]
    fn unescape_json_values_with_no_escapes() {
        let value = json!({"text": "Hello World"});
        let unescaped_value = unescape_json_values(&value);
        assert_eq!(unescaped_value, json!({"text": "Hello World"}));
    }

    #[test]
    fn test_is_google_model() {
        // Define the test cases as a vector of tuples
        let test_cases = vec![
            // (input, expected_result)
            (json!({ "model": "google_gemini" }), true),
            (json!({ "model": "microsoft_bing" }), false),
            (json!({ "model": "" }), false),
            (json!({}), false),
            (json!({ "model": "Google_XYZ" }), true),
            (json!({ "model": "google_abc" }), true),
        ];

        // Iterate through each test case and assert the result
        for (payload, expected_result) in test_cases {
            assert_eq!(is_google_model(&payload), expected_result);
        }
    }

    #[test]
    fn test_get_google_final_status_success() {
        let status = StatusCode::OK;
        let payload = json!({});
        let result = get_google_final_status(status, Some(&payload));
        assert_eq!(result, StatusCode::OK);
    }

    #[test]
    fn test_get_google_final_status_with_error_code() {
        // Test error code mappings for different payload error codes
        let test_cases = vec![
            // (error code, status, expected status code)
            (200, None, StatusCode::OK),
            (429, Some(StatusCode::OK), StatusCode::TOO_MANY_REQUESTS),
            (400, Some(StatusCode::OK), StatusCode::BAD_REQUEST),
            (401, Some(StatusCode::OK), StatusCode::UNAUTHORIZED),
            (403, Some(StatusCode::OK), StatusCode::FORBIDDEN),
            (404, Some(StatusCode::OK), StatusCode::NOT_FOUND),
            (500, Some(StatusCode::OK), StatusCode::INTERNAL_SERVER_ERROR),
            (503, Some(StatusCode::OK), StatusCode::SERVICE_UNAVAILABLE),
            (999, Some(StatusCode::OK), StatusCode::INTERNAL_SERVER_ERROR),
            (500, Some(StatusCode::BAD_REQUEST), StatusCode::BAD_REQUEST),
            (
                404,
                Some(StatusCode::INTERNAL_SERVER_ERROR),
                StatusCode::INTERNAL_SERVER_ERROR,
            ),
        ];

        for (error_code, status, expected_status) in test_cases {
            let payload = if let Some(_status) = status {
                json!({
                    "error": {
                        "code": error_code,
                        "message": "Error message"
                    }
                })
            } else {
                json!({})
            };

            let result = get_google_final_status(status.unwrap_or(StatusCode::OK), Some(&payload));
            assert_eq!(result, expected_status);
        }
    }

    #[test]
    fn test_parse_google_retry_delay() {
        let payload = json!({
            "error": {
                "details": [
                    {
                        "@type": "type.googleapis.com/google.rpc.RetryInfo",
                        "retryDelay": "42s"
                    }
                ]
            }
        });
        assert_eq!(
            parse_google_retry_delay(&payload),
            Some(Duration::from_secs(42))
        );
    }
}
