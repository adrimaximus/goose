pub use goose_providers::local_inference::*;

use crate::config::ExtensionConfig;
use crate::providers::api_client::TlsConfig;
use crate::providers::base::ProviderDef;
use anyhow::Result;
use futures::future::BoxFuture;

fn resolve_huggingface_token() -> BoxFuture<'static, Result<Option<String>>> {
    Box::pin(crate::providers::huggingface_auth::resolve_token_async())
}

fn resolve_string_param(key: &'static str) -> Result<Option<String>> {
    Ok(crate::config::Config::global()
        .get_param::<String>(key)
        .ok())
}

fn resolve_bool_param(key: &'static str) -> Result<Option<bool>> {
    Ok(crate::config::Config::global().get_param::<bool>(key).ok())
}

pub fn configure_local_inference() {
    huggingface_auth::set_token_resolver(resolve_huggingface_token);
    config_resolver::set_string_param_resolver(resolve_string_param);
    config_resolver::set_bool_param_resolver(resolve_bool_param);
}

<<<<<<< HEAD
pub fn available_inference_memory_bytes(runtime: &InferenceRuntime) -> u64 {
    let _ = &runtime.backend;
    let devices = list_llama_ggml_backend_devices();

    let accel_memory = devices
        .iter()
        .filter(|d| {
            matches!(
                d.device_type,
                LlamaBackendDeviceType::Gpu
                    | LlamaBackendDeviceType::IntegratedGpu
                    | LlamaBackendDeviceType::Accelerator
            )
        })
        .map(|d| d.memory_free as u64)
        .max()
        .unwrap_or(0);

    if accel_memory > 0 {
        accel_memory
    } else {
        devices
            .iter()
            .filter(|d| d.device_type == LlamaBackendDeviceType::Cpu)
            .map(|d| d.memory_free as u64)
            .max()
            .unwrap_or(0)
    }
}

pub fn recommend_local_model(runtime: &InferenceRuntime) -> String {
    use local_model_registry::{get_registry, is_featured_model, FEATURED_MODELS};

    let available_memory = available_inference_memory_bytes(runtime);

    if let Ok(registry) = get_registry().lock() {
        let mut models: Vec<_> = registry
            .list_models()
            .iter()
            .filter(|m| is_featured_model(&m.id) && m.size_bytes > 0)
            .collect();
        models.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));

        // Return largest that fits in available memory
        for model in &models {
            if available_memory >= model.size_bytes {
                return model.id.clone();
            }
        }

        // If nothing fits, return smallest
        if let Some(smallest) = models.last() {
            return smallest.id.clone();
        }
    }

    // Fallback to first featured model
    FEATURED_MODELS[0].spec.to_string()
}

fn build_openai_messages_json(system: &str, messages: &[Message]) -> String {
    use crate::providers::formats::openai::format_messages;
    use crate::providers::utils::ImageFormat;

    let mut arr: Vec<Value> = vec![json!({"role": "system", "content": system})];
    arr.extend(format_messages(messages, &ImageFormat::OpenAi));
    strip_image_parts_from_messages(&mut arr);
    serde_json::to_string(&arr).unwrap_or_else(|_| "[]".to_string())
}

/// Remove `image_url` content parts from OpenAI-format messages JSON, replacing
/// each with a text note. This prevents an FFI crash in llama.cpp which does not
/// accept `image_url` content-part types.
fn strip_image_parts_from_messages(messages: &mut [Value]) {
    let mut stripped = false;
    for msg in messages.iter_mut() {
        if let Some(content) = msg.get_mut("content").and_then(|c| c.as_array_mut()) {
            for part in content.iter_mut() {
                if part.get("type").and_then(|t| t.as_str()) == Some("image_url") {
                    *part = json!({
                        "type": "text",
                        "text": "[Image attached — image input is not supported with the currently selected model]"
                    });
                    stripped = true;
                }
            }
        }
    }
    if stripped {
        tracing::warn!(
            "Stripped image content parts from messages — vision encoder not available for this model"
        );
    }
}

/// Convert a message into plain text for the emulator path's chat history.
///
/// This is the emulator-path counterpart of [`format_messages`] used by the native
/// path. It reconstructs the text-based tool syntax that the emulator prompt teaches
/// the model:
///
/// - `ToolRequest` with a `"command"` argument → `$ command`
/// - `ToolRequest` with a `"code"` argument → `` ```execute_typescript\n…\n``` ``
/// - `ToolResponse` → `Command output:\n…`
///
/// Only `developer__shell` and `code_execution__execute_typescript` style tool calls are
/// recognized (by argument shape, not tool name). Tool calls from other extensions
/// (e.g. custom MCP tools made by a native-tool-calling model earlier in the
/// conversation) are silently dropped, since the emulator path has no syntax to
/// represent them.
fn extract_text_content(msg: &Message) -> String {
    let mut parts = Vec::new();

    for content in &msg.content {
        match content {
            MessageContent::Text(text) => {
                parts.push(text.text.clone());
            }
            MessageContent::ToolRequest(req) => {
                if let Ok(call) = &req.tool_call {
                    if let Some(cmd) = call
                        .arguments
                        .as_ref()
                        .and_then(|a| a.get("command"))
                        .and_then(|v| v.as_str())
                    {
                        parts.push(format!("$ {}", cmd));
                    } else if let Some(code) = call
                        .arguments
                        .as_ref()
                        .and_then(|a| a.get("code"))
                        .and_then(|v| v.as_str())
                    {
                        parts.push(format!("```execute_typescript\n{}\n```", code));
                    }
                }
            }
            MessageContent::ToolResponse(response) => match &response.tool_result {
                Ok(result) => {
                    let mut output_parts = Vec::new();
                    for content_item in &result.content {
                        if let Some(text_content) = content_item.as_text() {
                            output_parts.push(text_content.text.to_string());
                        }
                    }
                    if !output_parts.is_empty() {
                        parts.push(format!("Command output:\n{}", output_parts.join("\n")));
                    }
                }
                Err(e) => {
                    parts.push(format!("Command error: {}", e));
                }
            },
            MessageContent::Image(_) => {
                parts.push(
                    "[Image attached — image input is not supported with the currently selected model]"
                        .to_string(),
                );
            }
            _ => {}
        }
    }

    parts.join("\n")
}

/// Build a `ProviderUsage` and write the request log entry.
fn finalize_usage(
    log: &mut RequestLog,
    model_name: String,
    path_label: &str,
    prompt_token_count: usize,
    output_token_count: i32,
    extra_log_fields: Option<(&str, &str)>,
) -> ProviderUsage {
    let input_tokens = prompt_token_count as i32;
    let total_tokens = input_tokens + output_token_count;
    let usage = Usage::new(
        Some(input_tokens),
        Some(output_token_count),
        Some(total_tokens),
    );
    let mut log_json = serde_json::json!({
        "path": path_label,
        "prompt_tokens": input_tokens,
        "output_tokens": output_token_count,
    });
    if let Some((key, value)) = extra_log_fields {
        log_json[key] = serde_json::json!(value);
    }
    let _ = log.write(&log_json, Some(&usage));
    ProviderUsage::new(model_name, usage)
}

type StreamSender =
    tokio::sync::mpsc::Sender<Result<(Option<Message>, Option<ProviderUsage>), ProviderError>>;

pub struct LocalInferenceProvider {
    runtime: Arc<InferenceRuntime>,
    model: ModelSlot,
    model_config: ModelConfig,
    name: String,
}

impl LocalInferenceProvider {
    pub async fn from_env(model: ModelConfig, _extensions: Vec<ExtensionConfig>) -> Result<Self> {
        let runtime = InferenceRuntime::get_or_init();
        let model_slot = runtime.get_or_create_model_slot(&model.model_name);
        Ok(Self {
            runtime,
            model: model_slot,
            model_config: model,
            name: PROVIDER_NAME.to_string(),
        })
    }

    fn load_model_sync(
        runtime: &InferenceRuntime,
        model_id: &str,
        settings: &crate::providers::local_inference::local_model_registry::ModelSettings,
    ) -> Result<LoadedModel, ProviderError> {
        let resolved = resolve_model_path(model_id)
            .ok_or_else(|| ProviderError::ExecutionError(format!("Unknown model: {}", model_id)))?;
        let model_path = resolved.model_path;

        if !model_path.exists() {
            return Err(ProviderError::ExecutionError(format!(
                "Model not downloaded: {}. Please download it from Settings > Local Inference.",
                model_id
            )));
        }

        tracing::info!("Loading {} from: {}", model_id, model_path.display());

        let backend = runtime.backend();

        let mut params = LlamaModelParams::default();
        if let Some(n_gpu_layers) = settings.n_gpu_layers {
            params = params.with_n_gpu_layers(n_gpu_layers);
        }
        if settings.use_mlock {
            params = params.with_use_mlock(true);
        }
        let model = LlamaModel::load_from_file(backend, &model_path, &params)
            .map_err(|e| ProviderError::ExecutionError(e.to_string()))?;

        let template = match model.chat_template(None) {
            Ok(t) => t,
            Err(_) => {
                tracing::warn!("Model has no embedded chat template, falling back to chatml");
                LlamaChatTemplate::new("chatml").map_err(|e| {
                    ProviderError::ExecutionError(format!(
                        "Failed to create fallback chat template: {}",
                        e
                    ))
                })?
            }
        };

        let mtmd_ctx = Self::init_mtmd_context(&model, &resolved.mmproj_path, settings);

        tracing::info!(model_id = model_id, "Model loaded successfully");

        Ok(LoadedModel {
            model,
            template,
            mtmd_ctx,
        })
    }

    fn init_mtmd_context(
        model: &LlamaModel,
        mmproj_path: &Option<PathBuf>,
        settings: &crate::providers::local_inference::local_model_registry::ModelSettings,
    ) -> Option<llama_cpp_2::mtmd::MtmdContext> {
        use llama_cpp_2::mtmd::{MtmdContext, MtmdContextParams};

        let mmproj_path = mmproj_path.as_ref().filter(|p| p.exists())?;

        let params = MtmdContextParams {
            use_gpu: true,
            n_threads: settings
                .n_threads
                .unwrap_or_else(|| MtmdContextParams::default().n_threads),
            ..MtmdContextParams::default()
        };

        match MtmdContext::init_from_file(mmproj_path.to_str().unwrap_or_default(), model, &params)
        {
            Ok(ctx) => {
                tracing::info!(
                    vision = ctx.support_vision(),
                    audio = ctx.support_audio(),
                    "Multimodal context initialized"
                );
                Some(ctx)
            }
            Err(e) => {
                tracing::warn!(error = %e, "Failed to init multimodal context");
                None
            }
        }
    }
=======
pub fn configure_huggingface_auth() {
    configure_local_inference();
>>>>>>> a0aed81f36076cfe48def4b21c04d7f0d33072e8
}

impl ProviderDef for LocalInferenceProvider {
    type Provider = Self;

    fn from_env(
        _extensions: Vec<ExtensionConfig>,
        _tls_config: Option<TlsConfig>,
    ) -> BoxFuture<'static, Result<Self::Provider>>
    where
        Self: Sized,
    {
        configure_local_inference();
        Box::pin(Self::from_env())
    }
}
