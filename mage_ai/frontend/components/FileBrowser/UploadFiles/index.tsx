import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ApiErrorType from '@interfaces/ApiErrorType';
import Button from '@oracle/elements/Button';
import FileType from '@interfaces/FileType';
import FileUploader from '@components/FileUploader';
import FlexContainer from '@oracle/components/FlexContainer';
import Panel from '@oracle/components/Panel';
import ProgressBar from '@oracle/components/ProgressBar';
import Spacing from '@oracle/elements/Spacing';
import Table from '@components/shared/Table';
import Text from '@oracle/elements/Text';
import { DropZoneStyle, TableStyle } from './index.style';
import { getFullPathWithoutRootFolder } from '../utils';
import { isEmptyObject } from '@utils/hash';
import { sortByKey } from '@utils/array';

type UploadFilesProps = {
  fetchFileTree?: () => void;
  onCancel: () => void;
  selectedFolder: FileType;
};

function UploadFiles({
  fetchFileTree,
  onCancel,
  selectedFolder,
}: UploadFilesProps) {
  const { t } = useTranslation('common');
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const [fileUploadProgress, setFileUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [uploadedFiles, setUploadedFiles] = useState<{
    [key: string]: ApiErrorType & FileType;
  }>({});
  const hasFiles: boolean = !isEmptyObject(fileUploadProgress);

  const tableMemo = useMemo(() => {
    const rows = [];
    sortByKey(Object.entries(fileUploadProgress), ([name, _]) => name).forEach(([
      filename,
      progress,
    ]) => {
      const file: ApiErrorType & FileType = uploadedFiles[filename];
      const errorMessage = file?.message;

      rows.push([
        <div key={`name-${filename}`}>
          <Text
            overflowWrap
            preWrap
          >
            {filename}
          </Text>
          {errorMessage && (
            <Spacing mt={1}>
              <Text danger small>
                {errorMessage}
              </Text>
            </Spacing>
          )}
        </div>,
        <ProgressBar
          danger={!!errorMessage}
          key={`progress-${filename}`}
          progress={progress * 100}
        />,
      ]);
    });

    return (
      <Table
        columnFlex={[1, 4]}
        columns={[
          {
            label: () => t('files.file_browser.upload.columns.filename'),
            uuid: 'Filename',
          },
          {
            label: () => t('files.file_browser.upload.columns.upload_progress'),
            uuid: 'Upload progress',
          },
        ]}
        rows={rows}
        uuid="block-runs"
      />
    );
  }, [
    fileUploadProgress,
    t,
    uploadedFiles,
  ]);

  return (
    <Panel
      footer={(
        <FlexContainer fullWidth>
          <Button onClick={() => onCancel()}>
            {t('common.close')}
          </Button>
          {hasFiles && (
            <Spacing ml={1}>
              <Button
                onClick={() => {
                  setFileUploadProgress({});
                  setUploadedFiles({});
                }}
              >
                {t('files.file_browser.upload.actions.clear_and_retry')}
              </Button>
            </Spacing>
          )}
        </FlexContainer>
      )}
      headerTitle={t('files.file_browser.upload.title')}
    >
      {hasFiles && (
        <TableStyle>
          {tableMemo}
        </TableStyle>
      )}

      {!hasFiles && (
        <FileUploader
          directoryPath={selectedFolder ? getFullPathWithoutRootFolder(selectedFolder) : ''}
          onDragActiveChange={setIsDragActive}
          // @ts-ignore
          setFileUploadProgress={setFileUploadProgress}
          // @ts-ignore
          setUploadedFiles={(uploadedFiles) => {
            // @ts-ignore
            setUploadedFiles(uploadedFiles);
            fetchFileTree?.();
          }}
        >
          <DropZoneStyle>
            <Text center>
              {isDragActive
                ? t('files.file_browser.upload.dropzone.drop_to_upload')
                : t('files.file_browser.upload.dropzone.click_or_drop')
              }
            </Text>
          </DropZoneStyle>
        </FileUploader>
      )}
    </Panel>
  );
}

export default UploadFiles;
