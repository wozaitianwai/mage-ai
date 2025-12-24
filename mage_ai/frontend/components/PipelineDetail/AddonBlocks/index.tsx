import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useRouter } from 'next/router';

import AddonBlock from './AddonBlock';
import Flex from '@oracle/components/Flex';
import FlexContainer from '@oracle/components/FlexContainer';
import Link from '@oracle/elements/Link';
import Panel from '@oracle/components/Panel';
import PanelV2 from '@oracle/components/Panel/v2';
import Spacing from '@oracle/elements/Spacing';
import Text from '@oracle/elements/Text';
import { AddonBlockTypeEnum } from '@interfaces/AddonBlockOptionType';
import { BlockTypeEnum } from '@interfaces/BlockType';
import { Callback, ChevronRight, Conditional } from '@oracle/icons';
import { ExtensionProps } from '../Extensions/constants';
import { PADDING_UNITS, UNIT } from '@oracle/styles/units/spacing';
import { goToWithQuery } from '@utils/routing';
import { queryFromUrl } from '@utils/url';

export type AddonBlocksProps = {} & ExtensionProps;

function AddonBlocks({
  ...props
}: AddonBlocksProps) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [selectedAddonUUID, setSelectedAddonUUID] = useState<string>(null);
  const addonBlockOptions = useMemo(() => ([
    {
      Icon: Callback,
      name: t('sidekick.addon_blocks.callbacks_name'),
      uuid: AddonBlockTypeEnum.CALLBACK,
    },
    {
      Icon: Conditional,
      name: t('sidekick.addon_blocks.conditionals_name'),
      uuid: AddonBlockTypeEnum.CONDITIONAL,
    },
  ]), [t]);

  useEffect(() => {
    setSelectedAddonUUID(queryFromUrl()?.addon);
  }, [router.asPath]);

  const addonDetailEl = useMemo(() => {
    let addOnProps;
    if (AddonBlockTypeEnum.CALLBACK === selectedAddonUUID) {
      addOnProps = {
        addOnBlockType: BlockTypeEnum.CALLBACK,
        addOnBlocks: props.pipeline?.callbacks,
        description: t('sidekick.addon_blocks.callbacks_description'),
        displayBlockName: 'callback',
      };
    }
    else if (AddonBlockTypeEnum.CONDITIONAL === selectedAddonUUID) {
      addOnProps = {
        addOnBlockType: BlockTypeEnum.CONDITIONAL,
        addOnBlocks: props.pipeline?.conditionals,
        description: t('sidekick.addon_blocks.conditionals_description'),
        displayBlockName: 'conditional',
      };
    }

    if (addOnProps) {
      return (
        <AddonBlock
          {...addOnProps}
          {...props}
        />
      );
    }
  }, [
    props,
    selectedAddonUUID,
    t,
  ]);

  return (
    <DndProvider backend={HTML5Backend}>
      <Spacing p={PADDING_UNITS}>
        {addonDetailEl}

        {!selectedAddonUUID && addonBlockOptions?.map(({
          name,
          uuid,
          Icon,
        }, idx: number) => (
          <Spacing key={uuid} mt={idx >= 1 ? PADDING_UNITS : 0}>
            <Link
              block
              noHoverUnderline
              onClick={() => goToWithQuery({
                addon: uuid,
              }, {
                pushHistory: true,
              })}
              preventDefault
            >
              <Panel dark>
                <FlexContainer
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Flex alignItems="center">
                    <PanelV2 fullWidth={false}>
                      <Spacing p={PADDING_UNITS}>
                        <FlexContainer alignItems="center">
                          <Icon fill="#885EFF" size={UNIT * 2} />
                        </FlexContainer>
                      </Spacing>
                    </PanelV2>

                    <Spacing mr={PADDING_UNITS} />

                    <Flex flexDirection="column">
                      <Text bold>
                        {name}
                      </Text>
                    </Flex>
                  </Flex>
                  <ChevronRight />
                </FlexContainer>
              </Panel>
            </Link>
          </Spacing>
        ))}
      </Spacing>
    </DndProvider>
  );
}

export default AddonBlocks;
