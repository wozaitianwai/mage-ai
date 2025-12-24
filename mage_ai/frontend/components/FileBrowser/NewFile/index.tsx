import { useEffect, useRef, useState } from 'react';
import { useMutation } from 'react-query';
import { useTranslation } from 'react-i18next';

import Button from '@oracle/elements/Button';
import FileType from '@interfaces/FileType';
import FlexContainer from '@oracle/components/FlexContainer';
import KeyboardShortcutButton from '@oracle/elements/Button/KeyboardShortcutButton';
import Panel from '@oracle/components/Panel';
import Spacing from '@oracle/elements/Spacing';
import TextInput from '@oracle/elements/Inputs/TextInput';
import api from '@api';
import { UNIT } from '@oracle/styles/units/spacing';
import { getFullPathWithoutRootFolder, removeRootFromFilePath } from '../utils';
import { isEmptyObject } from '@utils/hash';
import { onSuccess } from '@api/utils/response';

type NewFileProps = {
  fetchFileTree?: () => void;
  file?: FileType;
  moveFile?: boolean;
  onCancel: () => void;
  onCreateFile?: (file: FileType) => void;
  selectedFolder: FileType;
  showError?: (opts: {
    errors: any;
    response: any;
  }) => void;
};

function NewFile({
  fetchFileTree,
  file: fileProp,
  moveFile,
  onCancel,
  onCreateFile,
  selectedFolder,
  showError,
}: NewFileProps) {
  const { t } = useTranslation('common');
  const refTextInput = useRef(null);
  const file = isEmptyObject(fileProp) ? null : fileProp;

  const [directory, setDirectory] = useState<string>(file
    ? getFullPathWithoutRootFolder(file, null, true)
    : '',
  );
  const [filename, setFilename] = useState<string>(file
    ? file?.name
    : '',
  );

  useEffect(() => {
    refTextInput?.current?.focus();
  }, []);

  useEffect(() => {
    if (selectedFolder) {
      setDirectory(removeRootFromFilePath(selectedFolder?.uuid));
    }
  }, [selectedFolder]);

  const [createFile] = useMutation(
    api.files.useCreate(),
    {
      onSuccess: (response: any) => onSuccess(
        response, {
          callback: ({ file }) => {
            fetchFileTree?.();
            onCancel();
            onCreateFile?.(file);
          },
          onErrorCallback: (response, errors) => showError({
            errors,
            response,
          }),
        },
      ),
    },
  );
  const [updateFile] = useMutation(
    api.files.useUpdate(file && encodeURIComponent(getFullPathWithoutRootFolder(file))),
    {
      onSuccess: (response: any) => onSuccess(
        response, {
          callback: () => {
            fetchFileTree?.();
            onCancel();
          },
          onErrorCallback: (response, errors) => showError({
            errors,
            response,
          }),
        },
      ),
    },
  );

  return (
    <Panel
      footer={(
        <FlexContainer>
          <KeyboardShortcutButton
            bold
            disabled={!filename}
            inline
            onClick={() => {
              if (file) {
                // @ts-ignore
                return updateFile({
                  file: {
                    dir_path: directory,
                    name: filename,
                  },
                  file_json_only: true,
                });
              } else {
                // @ts-ignore
                return createFile({
                  file: {
                    dir_path: directory,
                    name: filename,
                    overwrite: false,
                  },
                  file_json_only: true,
                });
              }
            }}
            primary
            tabIndex={0}
            uuid="NewFile/create_file"
          >
            {file
              ? moveFile
                ? t('files.file_browser.new_file.actions.move_file')
                : t('files.file_browser.new_file.actions.rename_file')
              : t('files.file_browser.new_file.actions.create_file')
            }
          </KeyboardShortcutButton>

          <Spacing ml={1}>
            <Button
              onClick={() => onCancel()}
              tabIndex={0}
            >
              {t('common.cancel')}
            </Button>
          </Spacing>
        </FlexContainer>
      )}
      headerTitle={file
        ? moveFile
          ? t('files.file_browser.new_file.titles.move_file')
          : t('files.file_browser.new_file.titles.rename_file')
        : t('files.file_browser.new_file.titles.new_file')}
      minWidth={UNIT * 50}
    >
      <TextInput
        disabled={!!file && !moveFile}
        label={t('files.file_browser.fields.directory')}
        monospace
        onChange={e => setDirectory(e.target.value)}
        setContentOnMount
        value={directory}
      />

      <Spacing mt={2}>
        <TextInput
          disabled={!!moveFile}
          label={t('files.file_browser.fields.filename')}
          monospace
          onChange={e => setFilename(e.target.value)}
          ref={refTextInput}
          required
          value={filename}
        />
      </Spacing>
    </Panel>
  );
}

export default NewFile;
