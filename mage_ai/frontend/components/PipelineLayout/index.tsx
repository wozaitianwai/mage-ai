import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';

import ClickOutside from '@oracle/components/ClickOutside';
import ErrorPopup from '@components/ErrorPopup';
import Head from '@oracle/elements/Head';
import Header, { BreadcrumbType } from '@components/shared/Header';
import PipelineType from '@interfaces/PipelineType';
import TripleLayout from '@components/TripleLayout';
import {
  AFTER_DEFAULT_WIDTH,
  BEFORE_DEFAULT_WIDTH,
} from '@components/TripleLayout/index.style';
import {
  LOCAL_STORAGE_KEY_PIPELINE_EDITOR_AFTER_HIDDEN,
  LOCAL_STORAGE_KEY_PIPELINE_EDITOR_AFTER_WIDTH,
  LOCAL_STORAGE_KEY_PIPELINE_EDITOR_BEFORE_HIDDEN,
  LOCAL_STORAGE_KEY_PIPELINE_EDITOR_BEFORE_WIDTH,
  get,
  set,
} from '@storage/localStorage';
import { NavigationItem } from '@components/Dashboard/VerticalNavigation';
import { PAGE_NAME_EDIT } from '@components/PipelineDetail/constants';
import { useWindowSize } from '@utils/sizes';

type PipelineLayoutProps = {
  after?: any;
  afterFooter?: any;
  afterHeader?: any;
  afterHeightOffset?: number;
  afterHidden?: boolean;
  afterInnerHeightMinus?: number;
  afterNavigationItems?: NavigationItem[];
  afterOverflow?: 'hidden';
  afterSubheader?: any;
  before?: any;
  beforeDraggableTopOffset?: number;
  beforeHeader?: any;
  beforeHeightOffset?: number;
  beforeHidden?: boolean;
  beforeNavigationItems?: NavigationItem[];
  children: any;
  errors: any;
  footerOffset?: number;
  headerOffset?: number;
  mainContainerFooter?: any;
  mainContainerHeader?: any;
  mainContainerRef?: any;
  page: string;
  pipeline: PipelineType;
  setAfterHidden?: (value: boolean) => void;
  setAfterWidthForChildren?: (width: number) => void;
  setBeforeHidden?: (value: boolean) => void;
  setErrors?: (errors: any) => void;
  setMainContainerWidth?: (width: number) => void;
};

function PipelineLayout({
  after,
  afterFooter,
  afterHeader,
  afterHeightOffset,
  afterHidden: afterHiddenProp,
  afterInnerHeightMinus,
  afterNavigationItems,
  afterOverflow,
  afterSubheader,
  before,
  beforeDraggableTopOffset,
  beforeHeader,
  beforeHeightOffset,
  beforeHidden: beforeHiddenProp,
  beforeNavigationItems,
  children,
  errors,
  footerOffset,
  headerOffset,
  mainContainerFooter,
  mainContainerHeader,
  mainContainerRef,
  page,
  pipeline,
  setAfterHidden: setAfterHiddenProp,
  setAfterWidthForChildren,
  setBeforeHidden: setBeforeHiddenProp,
  setErrors,
  setMainContainerWidth,
}: PipelineLayoutProps) {
  const { t } = useTranslation('common');
  const {
    width: widthWindow,
  } = useWindowSize();
  const [afterWidth, setAfterWidth] = useState(
    get(LOCAL_STORAGE_KEY_PIPELINE_EDITOR_AFTER_WIDTH, AFTER_DEFAULT_WIDTH));
  const [beforeWidth, setBeforeWidth] = useState(
    get(LOCAL_STORAGE_KEY_PIPELINE_EDITOR_BEFORE_WIDTH, BEFORE_DEFAULT_WIDTH));

  const [afterMousedownActive, setAfterMousedownActive] = useState(false);
  const [beforeMousedownActive, setBeforeMousedownActive] = useState(false);

  let afterHidden = afterHiddenProp;
  let setAfterHidden = setAfterHiddenProp;

  if (!setAfterHidden) {
    [afterHidden, setAfterHidden] =
      useState(!!get(LOCAL_STORAGE_KEY_PIPELINE_EDITOR_AFTER_HIDDEN));
  }

  let beforeHidden = beforeHiddenProp;
  let setBeforeHidden = setBeforeHiddenProp;

  if (!setBeforeHidden) {
    [beforeHidden, setBeforeHidden] =
      useState(!!get(LOCAL_STORAGE_KEY_PIPELINE_EDITOR_BEFORE_HIDDEN));
  }

  useEffect(() => {
    if (mainContainerRef?.current && !afterMousedownActive && !beforeMousedownActive) {
      setMainContainerWidth?.(mainContainerRef.current.getBoundingClientRect().width);
    }
  }, [
    afterMousedownActive,
    beforeMousedownActive,
    afterHidden,
    afterWidth,
    beforeHidden,
    beforeWidth,
    mainContainerRef,
    setMainContainerWidth,
    widthWindow,
  ]);

  useEffect(() => {
    if (!afterMousedownActive) {
      setAfterWidthForChildren?.(afterWidth);
      set(LOCAL_STORAGE_KEY_PIPELINE_EDITOR_AFTER_WIDTH, afterWidth);
    }
  }, [
    afterMousedownActive,
    afterWidth,
    setAfterWidthForChildren,
  ]);
  useEffect(() => {
    if (!beforeMousedownActive) {
      set(LOCAL_STORAGE_KEY_PIPELINE_EDITOR_BEFORE_WIDTH, beforeWidth);
    }
  }, [
    beforeMousedownActive,
    beforeWidth,
  ]);

  const headerMemo = useMemo(() => {
    const breadcrumbs: BreadcrumbType[] = [
      {
        label: () => t('sidebar.pipelines'),
        linkProps: {
          as: '/pipelines',
          href: '/pipelines',
        },
      },
    ];

    if (pipeline) {
      breadcrumbs.push(...[
        {
          bold: PAGE_NAME_EDIT !== page,
          label: () => pipeline?.uuid,
          linkProps: {
            as: `/pipelines/${pipeline?.uuid}`,
            href: '/pipelines/[pipeline]',
          },
        },
      ]);

      if (PAGE_NAME_EDIT === page) {
        breadcrumbs.push(...[
          {
            bold: true,
            label: () => t('common.edit'),
          },
        ]);
      }
    }

    return (
      <Header
        breadcrumbs={breadcrumbs}
      />
    );
  }, [
    page,
    pipeline,
    t,
  ]);

  return (
    <>
      <Head title={pipeline?.name} />

      <TripleLayout
        after={after}
        afterFooter={afterFooter}
        afterHeader={afterHeader}
        afterHeightOffset={afterHeightOffset}
        afterHidden={afterHidden}
        afterInnerHeightMinus={afterInnerHeightMinus}
        afterMousedownActive={afterMousedownActive}
        afterNavigationItems={afterNavigationItems}
        afterOverflow={afterOverflow}
        afterSubheader={afterSubheader}
        afterWidth={afterWidth}
        before={before}
        beforeDraggableTopOffset={beforeDraggableTopOffset}
        beforeHeader={beforeHeader}
        beforeHeightOffset={beforeHeightOffset}
        beforeHidden={beforeHidden}
        beforeMousedownActive={beforeMousedownActive}
        beforeNavigationItems={beforeNavigationItems}
        beforeWidth={beforeWidth}
        footerOffset={footerOffset}
        header={headerMemo}
        headerOffset={headerOffset}
        mainContainerFooter={mainContainerFooter}
        mainContainerHeader={mainContainerHeader}
        mainContainerRef={mainContainerRef}
        navigationShowMore
        setAfterHidden={setAfterHidden}
        setAfterMousedownActive={setAfterMousedownActive}
        setAfterWidth={setAfterWidth}
        setBeforeHidden={setBeforeHidden}
        setBeforeMousedownActive={setBeforeMousedownActive}
        setBeforeWidth={setBeforeWidth}
        subtractTopFromBeforeDraggableHeight
      >
        {children}
      </TripleLayout>

      {errors && (
        <ClickOutside
          disableClickOutside
          isOpen
          onClickOutside={() => setErrors(null)}
        >
          <ErrorPopup
            {...errors}
            onClose={() => setErrors(null)}
          />
        </ClickOutside>
      )}
    </>
  );
}

export default PipelineLayout;
