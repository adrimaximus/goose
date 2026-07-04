import { ProviderDetails, getProviderModels, listLocalModels } from '../../../api';
import { errorMessage as getErrorMessage } from '../../../utils/conversionUtils';

const MODEL_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CachedProviderModels {
  result: ProviderModelsResult;
  fetchedAt: number;
}

// Module-level cache — persists across modal open/close within the same session
const providerModelsCache = new Map<string, CachedProviderModels>();

function getCached(providerName: string): ProviderModelsResult | null {
  const entry = providerModelsCache.get(providerName);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > MODEL_CACHE_TTL_MS) {
    providerModelsCache.delete(providerName);
    return null;
  }
  return entry.result;
}

function setCache(providerName: string, result: ProviderModelsResult): void {
  providerModelsCache.set(providerName, { result, fetchedAt: Date.now() });
}

export function invalidateProviderModelsCache(providerName?: string): void {
  if (providerName) {
    providerModelsCache.delete(providerName);
  } else {
    providerModelsCache.clear();
  }
}

export default interface Model {
  id?: number; // Make `id` optional to allow user-defined models
  name: string;
  provider: string;
  lastUsed?: string;
  alias?: string; // optional model display name
  subtext?: string; // goes below model name if not the provider
  context_limit?: number; // optional context limit override
  request_params?: Record<string, unknown>; // provider-specific request parameters
}

export function createModelStruct(
  modelName: string,
  provider: string,
  id?: number, // Make `id` optional to allow user-defined models
  lastUsed?: string,
  alias?: string, // optional model display name
  subtext?: string
): Model {
  // use the metadata to create a Model
  return {
    name: modelName,
    provider: provider,
    alias: alias,
    id: id,
    lastUsed: lastUsed,
    subtext: subtext,
  };
}

export async function getProviderMetadata(
  providerName: string,
  getProvidersFunc: (b: boolean) => Promise<ProviderDetails[]>
) {
  const providers = await getProvidersFunc(false);
  const matches = providers.find((providerMatch) => providerMatch.name === providerName);
  if (!matches) {
    throw Error(`No match for provider: ${providerName}`);
  }
  return matches.metadata;
}

export interface ProviderModelsResult {
  provider: ProviderDetails;
  models: string[] | null;
  error: string | null;
  warning: string | null;
}

export async function fetchModelsForProviders(
  activeProviders: ProviderDetails[]
): Promise<ProviderModelsResult[]> {
  const modelPromises = activeProviders.map(async (p) => {
    try {
      // For local provider, use listLocalModels and filter to only downloaded models
      if (p.name === 'local') {
        const response = await listLocalModels();
        const allModels = response.data || [];
        const downloadedModels = allModels
          .filter((m) => m.status.state === 'Downloaded')
          .map((m) => m.id);
        return { provider: p, models: downloadedModels, error: null, warning: null };
      }

      const response = await getProviderModels({
        path: { name: p.name },
        throwOnError: true,
      });
      const models = response.data || [];
      return { provider: p, models, error: null, warning: null };
    } catch (e: unknown) {
      // For custom providers, fall back to the configured model list
      if (p.provider_type === 'Custom') {
        const fallbackModels = p.metadata.known_models.map((m) => m.name);
        if (fallbackModels.length > 0) {
          console.warn(`Failed to fetch models for ${p.name}:`, getErrorMessage(e));
          return {
            provider: p,
            models: fallbackModels,
            error: null,
            warning: `Could not fetch models from provider — showing configured models instead.`,
          };
        }
      }

      const errMsg = getErrorMessage(e);
      const errorMessage = `Failed to fetch models for ${p.name}${errMsg ? `: ${errMsg}` : ''}`;
      return {
        provider: p,
        models: null,
        error: errorMessage,
        warning: null,
      };
    }
  });

  return await Promise.all(modelPromises);
}

// Per-provider timeout: if a provider's model API doesn't respond in time,
// skip it rather than blocking the entire modal for minutes.
const PROVIDER_MODEL_FETCH_TIMEOUT_MS = 15_000;

async function fetchSingleProviderModels(p: ProviderDetails): Promise<ProviderModelsResult> {
  // local models can change (download/delete) so always fetch fresh
  if (p.name === 'local') {
    const response = await listLocalModels();
    const allModels = response.data || [];
    const downloadedModels = allModels
      .filter((m) => m.status.state === 'Downloaded')
      .map((m) => m.id);
    return { provider: p, models: downloadedModels, error: null, warning: null };
  }

  const fetchPromise = getProviderModels({
    path: { name: p.name },
    throwOnError: true,
  }).then((response) => ({
    provider: p,
    models: (response.data || []) as string[],
    error: null as string | null,
    warning: null as string | null,
  }));

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error(`Timed out fetching models for ${p.name} after ${PROVIDER_MODEL_FETCH_TIMEOUT_MS / 1000}s`)),
      PROVIDER_MODEL_FETCH_TIMEOUT_MS
    )
  );

  return Promise.race([fetchPromise, timeoutPromise]);
}

export async function fetchModelsForProvidersProgressive(
  activeProviders: ProviderDetails[],
  onProviderResult: (result: ProviderModelsResult) => void
): Promise<void> {
  await Promise.all(
    activeProviders.map(async (p) => {
      // Return cached result immediately without hitting the network
      const cached = getCached(p.name);
      if (cached) {
        onProviderResult(cached);
        return;
      }

      let result: ProviderModelsResult;
      try {
        result = await fetchSingleProviderModels(p);
        setCache(p.name, result);
      } catch (e: unknown) {
        if (p.provider_type === 'Custom') {
          const fallbackModels = p.metadata.known_models.map((m) => m.name);
          if (fallbackModels.length > 0) {
            console.warn(`Failed to fetch models for ${p.name}:`, getErrorMessage(e));
            result = {
              provider: p,
              models: fallbackModels,
              error: null,
              warning: `Could not fetch models from provider — showing configured models instead.`,
            };
            setCache(p.name, result);
            onProviderResult(result);
            return;
          }
        }
        const errMsg = getErrorMessage(e);
        result = {
          provider: p,
          models: null,
          error: `Failed to fetch models for ${p.name}${errMsg ? `: ${errMsg}` : ''}`,
          warning: null,
        };
        // Don't cache errors — let the next open retry
      }
      onProviderResult(result);
    })
  );
}
