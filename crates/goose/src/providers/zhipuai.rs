use anyhow::Result;
use async_trait::async_trait;
use futures::future::BoxFuture;

use super::api_client::{ApiClient, AuthMethod};
use super::base::{ConfigKey, MessageStream, Provider, ProviderDef, ProviderMetadata};
use super::errors::ProviderError;
use super::openai_compatible::OpenAiCompatibleProvider;
use crate::config::ExtensionConfig;
use crate::model::ModelConfig;
use rmcp::model::Tool;

const ZHIPUAI_PROVIDER_NAME: &str = "zhipuai";
pub const ZHIPUAI_API_HOST: &str = "https://api.z.ai";
pub const ZHIPUAI_COMPLETIONS_PREFIX: &str = "api/coding/paas/v4/";
pub const ZHIPUAI_DEFAULT_MODEL: &str = "glm-5.1";
pub const ZHIPUAI_DOC_URL: &str = "https://bigmodel.cn/dev/api";

pub const ZHIPUAI_KNOWN_MODELS: &[&str] = &[
    "glm-5.2",
    "glm-5.1",
    "glm-4.6v",
    "glm-4-plus",
    "glm-4-air",
    "glm-4-air-250414",
    "glm-4-flash",
    "glm-4-flash-250414",
    "glm-4-long",
    "glm-z1-air",
    "glm-z1-flash",
    "glm-z1-plus",
];

/// Wraps OpenAiCompatibleProvider but overrides fetch_supported_models
/// to return a static list (coding plan API doesn't expose /models endpoint).
pub struct ZhipuAiInner {
    inner: OpenAiCompatibleProvider,
}

pub struct ZhipuAiProvider;

impl ProviderDef for ZhipuAiProvider {
    type Provider = ZhipuAiInner;

    fn metadata() -> ProviderMetadata {
        ProviderMetadata::new(
            ZHIPUAI_PROVIDER_NAME,
            "Zhipu AI (GLM)",
            "GLM models from Zhipu AI via coding plan endpoint, including GLM-5.1 and GLM-4 series",
            ZHIPUAI_DEFAULT_MODEL,
            ZHIPUAI_KNOWN_MODELS.to_vec(),
            ZHIPUAI_DOC_URL,
            vec![
                ConfigKey::new("ZHIPUAI_API_KEY", true, true, None, true),
                ConfigKey::new("ZHIPUAI_HOST", false, false, Some(ZHIPUAI_API_HOST), false),
            ],
        )
    }

    fn from_env(
        model: ModelConfig,
        _extensions: Vec<ExtensionConfig>,
    ) -> BoxFuture<'static, Result<ZhipuAiInner>> {
        Box::pin(async move {
            let config = crate::config::Config::global();
            let api_key: String = config.get_secret("ZHIPUAI_API_KEY")?;
            let host: String = config
                .get_param("ZHIPUAI_HOST")
                .unwrap_or_else(|_| ZHIPUAI_API_HOST.to_string());

            let api_client = ApiClient::new(host, AuthMethod::BearerToken(api_key))?;
            let inner = OpenAiCompatibleProvider::new(
                ZHIPUAI_PROVIDER_NAME.to_string(),
                api_client,
                model,
                ZHIPUAI_COMPLETIONS_PREFIX.to_string(),
            );

            Ok(ZhipuAiInner { inner })
        })
    }
}

#[async_trait]
impl Provider for ZhipuAiInner {
    fn get_name(&self) -> &str {
        self.inner.get_name()
    }

    fn get_model_config(&self) -> ModelConfig {
        self.inner.get_model_config()
    }

    /// Return static known models — coding plan API has no /models endpoint.
    async fn fetch_supported_models(&self) -> Result<Vec<String>, ProviderError> {
        Ok(ZHIPUAI_KNOWN_MODELS.iter().map(|s| s.to_string()).collect())
    }

    fn skip_canonical_filtering(&self) -> bool {
        // Skip canonical filtering so all known models are returned as-is
        true
    }

    async fn stream(
        &self,
        model_config: &ModelConfig,
        session_id: &str,
        system: &str,
        messages: &[crate::conversation::message::Message],
        tools: &[Tool],
    ) -> Result<MessageStream, ProviderError> {
        self.inner
            .stream(model_config, session_id, system, messages, tools)
            .await
    }

    fn retry_config(&self) -> super::retry::RetryConfig {
        Provider::retry_config(&self.inner)
    }
}
