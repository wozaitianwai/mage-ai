import {
  AISparkle,
  BatchPipeline,
  IntegrationPipeline,
  StreamingPipeline,
  TemplateShapes,
  Upload,
} from '@oracle/icons';
import { PipelineTypeEnum } from '@interfaces/PipelineType';
import { UNIT } from '@oracle/styles/units/spacing';
import { randomNameGenerator } from '@utils/string';
import type { TFunction } from 'i18next';

const ICON_SIZE = UNIT * 1.5;

export const getNewPipelineButtonMenuItems = (
  createPipeline: (
    reqBody: { pipeline: { name: string, type?: PipelineTypeEnum } },
  ) => void,
  opts?: {
    showAIModal?: () => void;
    showBrowseTemplates?: () => void;
    showCreatePipelineModal?: (opts: { pipelineType: PipelineTypeEnum }) => void;
    showImportPipelineModal?: () => void;
    t?: TFunction;
  },
) => {
  const t = opts?.t || ((key: string) => key);
  const arr = [
    {
      beforeIcon: <BatchPipeline />,
      label: () => t('pipelines.new_menu.standard'),
      onClick: () => {
        if (opts?.showCreatePipelineModal) {
          opts?.showCreatePipelineModal?.({ pipelineType: PipelineTypeEnum.PYTHON });
        } else {
          createPipeline({
            pipeline: {
              name: randomNameGenerator(),
            },
          });
        }
      },
      uuid: 'Pipelines/NewPipelineMenu/standard',
    },
    {
      beforeIcon: <IntegrationPipeline />,
      label: () => t('pipelines.new_menu.integration'),
      onClick: () => {
        if (opts?.showCreatePipelineModal) {
          opts?.showCreatePipelineModal?.({ pipelineType: PipelineTypeEnum.INTEGRATION });
        } else {
          createPipeline({
            pipeline: {
              name: randomNameGenerator(),
              type: PipelineTypeEnum.INTEGRATION,
            },
          });
        }
      },
      uuid: 'Pipelines/NewPipelineMenu/integration',
    },
    {
      beforeIcon: <StreamingPipeline size={ICON_SIZE} />,
      label: () => t('pipelines.new_menu.streaming'),
      onClick: () => {
        if (opts?.showCreatePipelineModal) {
          opts?.showCreatePipelineModal?.({ pipelineType: PipelineTypeEnum.STREAMING });
        } else {
          createPipeline({
            pipeline: {
              name: randomNameGenerator(),
              type: PipelineTypeEnum.STREAMING,
            },
          });
        }
      },
      uuid: 'Pipelines/NewPipelineMenu/streaming',
    },
  ];

  if (opts?.showBrowseTemplates) {
    arr.push({
      beforeIcon: <TemplateShapes />,
      label: () => t('pipelines.new_menu.template'),
      onClick: () => opts?.showBrowseTemplates?.(),
      uuid: 'Pipelines/NewPipelineMenu/custom_template',
    });
  }

  if (opts?.showImportPipelineModal) {
    arr.push({
      beforeIcon: <Upload />,
      label: () => t('pipelines.new_menu.import_zip'),
      onClick: () => opts?.showImportPipelineModal?.(),
      uuid: 'Pipelines/NewPipelineMenu/upload',
    });
  }

  if (opts?.showAIModal) {
    arr.push({
      beforeIcon: <AISparkle />,
      label: () => t('pipelines.new_menu.ai_beta'),
      onClick: () => opts?.showAIModal?.(),
      uuid: 'Pipelines/NewPipelineMenu/AI_modal',
    });
  }

  return arr;
};
