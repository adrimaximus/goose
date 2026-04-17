use std::collections::HashMap;

use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use crate::config::extensions::ExtensionEntry;
use crate::config::goose_mode::GooseMode;
use crate::slash_commands::SlashCommandMapping;

/// JSON Schema representation of Goose's config.yaml.
///
/// All keys are optional. Unknown keys are allowed (additionalProperties: true)
/// because Goose passes undocumented provider-specific keys through as
/// environment variable overrides.
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct GooseConfigSchema {
    // === Core Goose Settings ===
    #[serde(rename = "GOOSE_PROVIDER")]
    pub goose_provider: Option<String>,
    #[serde(rename = "GOOSE_MODEL")]
    pub goose_model: Option<String>,
    #[serde(rename = "GOOSE_MODE")]
    pub goose_mode: Option<GooseMode>,
    #[serde(rename = "GOOSE_MAX_TOKENS")]
    pub goose_max_tokens: Option<i32>,
    #[serde(rename = "GOOSE_CONTEXT_LIMIT")]
    pub goose_context_limit: Option<u64>,
    #[serde(rename = "GOOSE_INPUT_LIMIT")]
    pub goose_input_limit: Option<u64>,
    #[serde(rename = "GOOSE_MAX_TURNS")]
    pub goose_max_turns: Option<u32>,
    #[serde(rename = "GOOSE_MAX_ACTIVE_AGENTS")]
    pub goose_max_active_agents: Option<u64>,
    #[serde(rename = "GOOSE_AUTO_COMPACT_THRESHOLD")]
    pub goose_auto_compact_threshold: Option<f64>,
    #[serde(rename = "GOOSE_TOOL_PAIR_SUMMARIZATION")]
    pub goose_tool_pair_summarization: Option<bool>,
    #[serde(rename = "GOOSE_TOOL_CALL_CUTOFF")]
    pub goose_tool_call_cutoff: Option<u64>,
    #[serde(rename = "GOOSE_STREAM_TIMEOUT")]
    pub goose_stream_timeout: Option<u64>,
    #[serde(rename = "GOOSE_SEARCH_PATHS")]
    pub goose_search_paths: Option<Vec<String>>,
    #[serde(rename = "GOOSE_DISABLE_SESSION_NAMING")]
    pub goose_disable_session_naming: Option<bool>,
    #[serde(rename = "GOOSE_DISABLE_KEYRING")]
    pub goose_disable_keyring: Option<bool>,
    #[serde(rename = "GOOSE_TELEMETRY_ENABLED")]
    pub goose_telemetry_enabled: Option<bool>,
    #[serde(rename = "GOOSE_DEFAULT_EXTENSION_TIMEOUT")]
    pub goose_default_extension_timeout: Option<u64>,
    #[serde(rename = "GOOSE_PROMPT_EDITOR")]
    pub goose_prompt_editor: Option<String>,
    #[serde(rename = "GOOSE_PROMPT_EDITOR_ALWAYS")]
    pub goose_prompt_editor_always: Option<bool>,
    #[serde(rename = "GOOSE_ALLOWLIST")]
    pub goose_allowlist: Option<String>,
    #[serde(rename = "GOOSE_SYSTEM_PROMPT_FILE_PATH")]
    pub goose_system_prompt_file_path: Option<String>,
    #[serde(rename = "GOOSE_DEBUG")]
    pub goose_debug: Option<bool>,
    #[serde(rename = "GOOSE_SHOW_FULL_OUTPUT")]
    pub goose_show_full_output: Option<bool>,
    #[serde(rename = "GOOSE_STATUS_HOOK")]
    pub goose_status_hook: Option<String>,
    #[serde(rename = "GOOSE_LOCAL_ENABLE_THINKING")]
    pub goose_local_enable_thinking: Option<bool>,
    #[serde(rename = "GOOSE_DATABRICKS_CLIENT_REQUEST_ID")]
    pub goose_databricks_client_request_id: Option<bool>,
    #[serde(rename = "CONTEXT_FILE_NAMES")]
    pub context_file_names: Option<Vec<String>>,
    #[serde(rename = "EDIT_MODE")]
    pub edit_mode: Option<String>,
    #[serde(rename = "RANDOM_THINKING_MESSAGES")]
    pub random_thinking_messages: Option<bool>,
    #[serde(rename = "CODE_MODE_TOOL_DISCLOSURE")]
    pub code_mode_tool_disclosure: Option<bool>,

    // === mTLS Settings ===
    #[serde(rename = "GOOSE_CLIENT_CERT_PATH")]
    pub goose_client_cert_path: Option<String>,
    #[serde(rename = "GOOSE_CLIENT_KEY_PATH")]
    pub goose_client_key_path: Option<String>,
    #[serde(rename = "GOOSE_CA_CERT_PATH")]
    pub goose_ca_cert_path: Option<String>,

    // === Planner & Subagent Settings ===
    #[serde(rename = "GOOSE_PLANNER_PROVIDER")]
    pub goose_planner_provider: Option<String>,
    #[serde(rename = "GOOSE_PLANNER_MODEL")]
    pub goose_planner_model: Option<String>,
    #[serde(rename = "GOOSE_SUBAGENT_PROVIDER")]
    pub goose_subagent_provider: Option<String>,
    #[serde(rename = "GOOSE_SUBAGENT_MODEL")]
    pub goose_subagent_model: Option<String>,
    #[serde(rename = "GOOSE_SUBAGENT_MAX_TURNS")]
    pub goose_subagent_max_turns: Option<u64>,
    #[serde(rename = "GOOSE_MAX_BACKGROUND_TASKS")]
    pub goose_max_background_tasks: Option<u64>,

    // === Recipe Settings ===
    #[serde(rename = "GOOSE_RECIPE_GITHUB_REPO")]
    pub goose_recipe_github_repo: Option<String>,
    #[serde(rename = "GOOSE_RECIPE_RETRY_TIMEOUT_SECONDS")]
    pub goose_recipe_retry_timeout_seconds: Option<u64>,
    #[serde(rename = "GOOSE_RECIPE_ON_FAILURE_TIMEOUT_SECONDS")]
    pub goose_recipe_on_failure_timeout_seconds: Option<u64>,

    // === CLI Settings ===
    #[serde(rename = "GOOSE_CLI_MIN_PRIORITY")]
    pub goose_cli_min_priority: Option<f32>,
    #[serde(rename = "GOOSE_CLI_THEME")]
    pub goose_cli_theme: Option<String>,
    #[serde(rename = "GOOSE_CLI_LIGHT_THEME")]
    pub goose_cli_light_theme: Option<String>,
    #[serde(rename = "GOOSE_CLI_DARK_THEME")]
    pub goose_cli_dark_theme: Option<String>,
    #[serde(rename = "GOOSE_CLI_SHOW_COST")]
    pub goose_cli_show_cost: Option<bool>,
    #[serde(rename = "GOOSE_CLI_SHOW_THINKING")]
    pub goose_cli_show_thinking: Option<bool>,
    #[serde(rename = "GOOSE_CLI_NEWLINE_KEY")]
    pub goose_cli_newline_key: Option<String>,

    // === AI Agent / Thinking Settings ===
    #[serde(rename = "CLAUDE_CODE_COMMAND")]
    pub claude_code_command: Option<String>,
    #[serde(rename = "GEMINI_CLI_COMMAND")]
    pub gemini_cli_command: Option<String>,
    #[serde(rename = "CURSOR_AGENT_COMMAND")]
    pub cursor_agent_command: Option<String>,
    #[serde(rename = "CODEX_COMMAND")]
    pub codex_command: Option<String>,
    #[serde(rename = "CODEX_REASONING_EFFORT")]
    pub codex_reasoning_effort: Option<String>,
    #[serde(rename = "CODEX_ENABLE_SKILLS")]
    pub codex_enable_skills: Option<String>,
    #[serde(rename = "CODEX_SKIP_GIT_CHECK")]
    pub codex_skip_git_check: Option<String>,
    #[serde(rename = "CHATGPT_CODEX_REASONING_EFFORT")]
    pub chatgpt_codex_reasoning_effort: Option<String>,
    #[serde(rename = "CLAUDE_THINKING_TYPE")]
    pub claude_thinking_type: Option<String>,
    #[serde(rename = "CLAUDE_THINKING_EFFORT")]
    pub claude_thinking_effort: Option<String>,
    #[serde(rename = "CLAUDE_THINKING_BUDGET")]
    pub claude_thinking_budget: Option<i32>,
    #[serde(rename = "GEMINI3_THINKING_LEVEL")]
    pub gemini3_thinking_level: Option<String>,
    #[serde(rename = "GEMINI25_THINKING_BUDGET")]
    pub gemini25_thinking_budget: Option<i32>,

    // === Security Settings ===
    #[serde(rename = "SECURITY_PROMPT_ENABLED")]
    pub security_prompt_enabled: Option<bool>,
    #[serde(rename = "SECURITY_PROMPT_THRESHOLD")]
    pub security_prompt_threshold: Option<f64>,
    #[serde(rename = "SECURITY_PROMPT_CLASSIFIER_ENABLED")]
    pub security_prompt_classifier_enabled: Option<bool>,
    #[serde(rename = "SECURITY_PROMPT_CLASSIFIER_MODEL")]
    pub security_prompt_classifier_model: Option<String>,
    #[serde(rename = "SECURITY_PROMPT_CLASSIFIER_ENDPOINT")]
    pub security_prompt_classifier_endpoint: Option<String>,
    #[serde(rename = "SECURITY_COMMAND_CLASSIFIER_ENABLED")]
    pub security_command_classifier_enabled: Option<bool>,

    // === Provider Settings ===
    #[serde(rename = "OPENAI_HOST")]
    pub openai_host: Option<String>,
    #[serde(rename = "OPENAI_BASE_PATH")]
    pub openai_base_path: Option<String>,
    #[serde(rename = "OPENAI_ORGANIZATION")]
    pub openai_organization: Option<String>,
    #[serde(rename = "OPENAI_PROJECT")]
    pub openai_project: Option<String>,
    #[serde(rename = "OPENAI_TIMEOUT")]
    pub openai_timeout: Option<u64>,
    #[serde(rename = "ANTHROPIC_HOST")]
    pub anthropic_host: Option<String>,
    #[serde(rename = "OLLAMA_HOST")]
    pub ollama_host: Option<String>,
    #[serde(rename = "OLLAMA_TIMEOUT")]
    pub ollama_timeout: Option<u64>,
    #[serde(rename = "OLLAMA_STREAM_TIMEOUT")]
    pub ollama_stream_timeout: Option<u64>,
    #[serde(rename = "OLLAMA_STREAM_USAGE")]
    pub ollama_stream_usage: Option<bool>,
    #[serde(rename = "DATABRICKS_HOST")]
    pub databricks_host: Option<String>,
    #[serde(rename = "DATABRICKS_MAX_RETRIES")]
    pub databricks_max_retries: Option<u64>,
    #[serde(rename = "DATABRICKS_INITIAL_RETRY_INTERVAL_MS")]
    pub databricks_initial_retry_interval_ms: Option<u64>,
    #[serde(rename = "DATABRICKS_BACKOFF_MULTIPLIER")]
    pub databricks_backoff_multiplier: Option<f64>,
    #[serde(rename = "DATABRICKS_MAX_RETRY_INTERVAL_MS")]
    pub databricks_max_retry_interval_ms: Option<u64>,
    #[serde(rename = "AZURE_OPENAI_ENDPOINT")]
    pub azure_openai_endpoint: Option<String>,
    #[serde(rename = "AZURE_OPENAI_DEPLOYMENT_NAME")]
    pub azure_openai_deployment_name: Option<String>,
    #[serde(rename = "AZURE_OPENAI_API_VERSION")]
    pub azure_openai_api_version: Option<String>,
    #[serde(rename = "GOOGLE_HOST")]
    pub google_host: Option<String>,
    #[serde(rename = "GCP_PROJECT_ID")]
    pub gcp_project_id: Option<String>,
    #[serde(rename = "GCP_LOCATION")]
    pub gcp_location: Option<String>,
    #[serde(rename = "GCP_MAX_RETRIES")]
    pub gcp_max_retries: Option<u64>,
    #[serde(rename = "GCP_INITIAL_RETRY_INTERVAL_MS")]
    pub gcp_initial_retry_interval_ms: Option<u64>,
    #[serde(rename = "GCP_BACKOFF_MULTIPLIER")]
    pub gcp_backoff_multiplier: Option<f64>,
    #[serde(rename = "GCP_MAX_RETRY_INTERVAL_MS")]
    pub gcp_max_retry_interval_ms: Option<u64>,
    #[serde(rename = "AWS_REGION")]
    pub aws_region: Option<String>,
    #[serde(rename = "AWS_PROFILE")]
    pub aws_profile: Option<String>,
    #[serde(rename = "BEDROCK_MAX_RETRIES")]
    pub bedrock_max_retries: Option<u64>,
    #[serde(rename = "BEDROCK_INITIAL_RETRY_INTERVAL_MS")]
    pub bedrock_initial_retry_interval_ms: Option<u64>,
    #[serde(rename = "BEDROCK_BACKOFF_MULTIPLIER")]
    pub bedrock_backoff_multiplier: Option<f64>,
    #[serde(rename = "BEDROCK_MAX_RETRY_INTERVAL_MS")]
    pub bedrock_max_retry_interval_ms: Option<u64>,
    #[serde(rename = "BEDROCK_ENABLE_CACHING")]
    pub bedrock_enable_caching: Option<bool>,
    #[serde(rename = "SAGEMAKER_ENDPOINT_NAME")]
    pub sagemaker_endpoint_name: Option<String>,
    #[serde(rename = "LITELLM_HOST")]
    pub litellm_host: Option<String>,
    #[serde(rename = "LITELLM_BASE_PATH")]
    pub litellm_base_path: Option<String>,
    #[serde(rename = "LITELLM_TIMEOUT")]
    pub litellm_timeout: Option<u64>,
    #[serde(rename = "SNOWFLAKE_HOST")]
    pub snowflake_host: Option<String>,
    #[serde(rename = "GITHUB_COPILOT_HOST")]
    pub github_copilot_host: Option<String>,
    #[serde(rename = "GITHUB_COPILOT_CLIENT_ID")]
    pub github_copilot_client_id: Option<String>,
    #[serde(rename = "GITHUB_COPILOT_TOKEN_URL")]
    pub github_copilot_token_url: Option<String>,
    #[serde(rename = "XAI_HOST")]
    pub xai_host: Option<String>,
    #[serde(rename = "OPENROUTER_HOST")]
    pub openrouter_host: Option<String>,
    #[serde(rename = "VENICE_HOST")]
    pub venice_host: Option<String>,
    #[serde(rename = "VENICE_BASE_PATH")]
    pub venice_base_path: Option<String>,
    #[serde(rename = "VENICE_MODELS_PATH")]
    pub venice_models_path: Option<String>,
    #[serde(rename = "TETRATE_HOST")]
    pub tetrate_host: Option<String>,
    #[serde(rename = "AVIAN_HOST")]
    pub avian_host: Option<String>,

    // === Observability Settings (lowercase keys) ===
    pub otel_exporter_otlp_endpoint: Option<String>,
    pub otel_exporter_otlp_timeout: Option<u64>,

    // === Tunnel Settings (lowercase keys) ===
    pub tunnel_auto_start: Option<bool>,

    // === Structured Config (lowercase keys) ===
    pub extensions: Option<HashMap<String, ExtensionEntry>>,
    pub slash_commands: Option<Vec<SlashCommandMapping>>,
    pub experiments: Option<HashMap<String, bool>>,
}
