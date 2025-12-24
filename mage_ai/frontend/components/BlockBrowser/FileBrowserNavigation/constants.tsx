import { ALL_BLOCK_TYPES } from '@interfaces/BlockType';
import { BatchSquaresStacked, FolderOutline } from '@oracle/icons';
import { NAV_LINKS as NAV_LINKS_INIT } from '@components/CustomTemplates/BrowseTemplates/constants';
import { TemplateShapes } from '@oracle/icons';

export enum FileContextTab {
  BLOCKS = 'blocks',
  FILES = 'files',
}

export enum NavLinkUUIDEnum {
  ALL_BLOCKS = 'all_blocks',
  ALL_BLOCKS_IN_TYPE = 'all_blocks_in_type',
}

export const NAV_LINKS = (t: any) => [
  {
    Icon: TemplateShapes,
    label: () => t ? t('block_browser.all_blocks') : 'All blocks',
    uuid: NavLinkUUIDEnum.ALL_BLOCKS,
  },
  // @ts-ignore
].concat(NAV_LINKS_INIT(t)?.filter(({
  uuid,
}) => uuid in ALL_BLOCK_TYPES));

export const TABS_MAPPING = (t?: any) => ({
  [FileContextTab.FILES]: {
    Icon: FolderOutline,
    label: () => t ? t('block_browser.tabs.all_files') : 'All files',
    uuid: FileContextTab.FILES,
  },
  [FileContextTab.BLOCKS]: {
    Icon: BatchSquaresStacked,
    label: () => t ? t('block_browser.tabs.current_blocks') : 'Current blocks',
    uuid: FileContextTab.BLOCKS,
  },
});

export function getTabs(t?: any) {
  return [
    TABS_MAPPING(t)[FileContextTab.FILES],
    TABS_MAPPING(t)[FileContextTab.BLOCKS],
  ];
}
