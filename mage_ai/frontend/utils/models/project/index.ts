import ProjectType, {
  AIConfigType,
  AIProviderEnum,
  FeatureUUIDEnum,
} from '@interfaces/ProjectType';

export function featureEnabled(project: ProjectType, featureUUID: FeatureUUIDEnum): boolean {
  return !!project?.features?.[featureUUID];
}

export function getAIConfig(project: ProjectType): AIConfigType {
  const aiConfig = project?.ai_config || {};
  const mode = aiConfig?.mode || AIProviderEnum.OPEN_AI;
  const openAIConfig = {
    ...(aiConfig?.open_ai_config || {}),
  };
  if (
    !openAIConfig.openai_api_key
    && project?.openai_api_key
    && [AIProviderEnum.OPEN_AI, AIProviderEnum.OPENAI_COMPATIBLE].includes(mode)
  ) {
    openAIConfig.openai_api_key = project.openai_api_key;
  }
  return {
    mode,
    open_ai_config: openAIConfig,
    hugging_face_config: aiConfig?.hugging_face_config || {},
  };
}

export function isAIConfigured(project: ProjectType): boolean {
  const aiConfig = getAIConfig(project);
  const openAIKey = aiConfig?.open_ai_config?.openai_api_key
    || (aiConfig?.mode === AIProviderEnum.OPEN_AI && project?.openai_api_key);
  if (aiConfig?.mode === AIProviderEnum.HUGGING_FACE) {
    return !!(
      aiConfig?.hugging_face_config?.huggingface_api
      && aiConfig?.hugging_face_config?.huggingface_inference_api_token
    );
  }
  return !!openAIKey;
}
