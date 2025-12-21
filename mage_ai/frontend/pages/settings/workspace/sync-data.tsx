import React, { useEffect, useMemo, useState } from 'react';
import NextLink from 'next/link';
import { toast } from 'react-toastify';
import { useMutation } from 'react-query';
import { useTranslation } from 'react-i18next';

import Button from '@oracle/elements/Button';
import ButtonTabs, { TabType } from '@oracle/components/Tabs/ButtonTabs';
import Checkbox from '@oracle/elements/Checkbox';
import ClickOutside from '@oracle/components/ClickOutside';
import Divider from '@oracle/elements/Divider';
import ErrorPopup from '@components/ErrorPopup';
import ErrorsType from '@interfaces/ErrorsType';
import FlexContainer from '@oracle/components/FlexContainer';
import Headline from '@oracle/elements/Headline';
import Link from '@oracle/elements/Link';
import PrivateRoute from '@components/shared/PrivateRoute';
import Select from '@oracle/elements/Inputs/Select';
import SettingsDashboard from '@components/settings/Dashboard';
import Spacing from '@oracle/elements/Spacing';
import SyncType, {
  AuthType,
  GIT_FIELDS,
  HTTPS_GIT_FIELDS,
  SSH_GIT_FIELDS,
  SYNC_FIELDS,
  UserGitSettingsType,
} from '@interfaces/SyncType';
import Text from '@oracle/elements/Text';
import TextInput from '@oracle/elements/Inputs/TextInput';
import VariableRow from '@components/Sidekick/GlobalVariables/VariableRow';
import api from '@api';
import {
  PADDING_UNITS,
  UNITS_BETWEEN_ITEMS_IN_SECTIONS,
  UNITS_BETWEEN_SECTIONS,
} from '@oracle/styles/units/spacing';
import {
  SECTION_ITEM_UUID_GIT_SETTINGS,
  SECTION_UUID_WORKSPACE,
} from '@components/settings/Dashboard/constants';
import { VariableType } from '@interfaces/PipelineVariableType';
import { goToWithQuery } from '@utils/routing';
import { onSuccess } from '@api/utils/response';
import { queryFromUrl } from '@utils/url';

const TAB_GIT_SYNC_UUID = 'git_sync';
const TAB_GIT_INTEGRATION_UUID = 'git_integration';

export interface SyncFieldType {
  autoComplete?: string;
  disabled?: boolean;
  label: string;
  labelDescription?: string;
  required?: boolean;
  type?: string;
  uuid: string;
}

function SyncData() {
  const { t } = useTranslation('common');
  const { data: dataSyncs, mutate: fetchSyncs } = api.syncs.list();
  const [sync, setSync] = useState<SyncType>(null);
  const [userGitSettings, setUserGitSettings] = useState<UserGitSettingsType>(null);
  const [errors, setErrors] = useState<ErrorsType>(null);

  useEffect(() => {
    if (dataSyncs) {
      const initialSync = dataSyncs?.syncs?.[0];
      setUserGitSettings(initialSync?.user_git_settings);
      setSync(initialSync);
    }
  }, [dataSyncs]);

  const showSyncOperations = useMemo(() => {
    if (dataSyncs) {
      const config = dataSyncs?.syncs?.[0];
      return !!config?.branch;
    }
    return false;
  }, [dataSyncs]);

  const {
    data: dataGitBranch,
    mutate: fetchBranch,
  } = api.git_branches.detail('test',
    {
      _format: 'with_basic_details',
    },
    {
      revalidateOnFocus: false,
    },
  );

  const {
    is_git_integration_enabled: gitIntegrationEnabled,
  } = useMemo(() => dataGitBranch?.['git_branch'] || {}, [dataGitBranch]);

  const tabLabelMapping = useMemo(() => ({
    [TAB_GIT_SYNC_UUID]: t('sync_data.tabs.git_sync'),
    [TAB_GIT_INTEGRATION_UUID]: t('sync_data.tabs.git_integration'),
  }), [t]);

  const tabsToUse = useMemo(() => ([
    {
      label: () => tabLabelMapping[TAB_GIT_SYNC_UUID],
      uuid: TAB_GIT_SYNC_UUID,
    },
    {
      label: () => tabLabelMapping[TAB_GIT_INTEGRATION_UUID],
      uuid: TAB_GIT_INTEGRATION_UUID,
    },
  ]), [tabLabelMapping]);

  const fieldLabelMapping = useMemo(() => ({
    access_token: t('sync_data.fields.access_token'),
    branch: t('sync_data.fields.branch'),
    email: t('sync_data.fields.email'),
    remote_repo_link: t('sync_data.fields.remote_repo_link'),
    repo_path: t('sync_data.fields.repo_path'),
    ssh_private_key: t('sync_data.fields.ssh_private_key'),
    ssh_public_key: t('sync_data.fields.ssh_public_key'),
    username: t('sync_data.fields.username'),
  }), [t]);

  const fieldDescriptionMapping = useMemo(() => ({
    access_token: t('sync_data.fields.access_token_description'),
    repo_path: t('sync_data.fields.repo_path_description'),
  }), [t]);

  const authTypeLabelMapping = useMemo(() => ({
    [AuthType.HTTPS]: t('sync_data.auth_types.https'),
    [AuthType.SSH]: t('sync_data.auth_types.ssh'),
  }), [t]);

  const [createSync, { isLoading: isLoadingCreateSync }] = useMutation(
    api.syncs.useCreate(),
    {
      onSuccess: (response: any) => onSuccess(
        response, {
          callback: ({ sync }) => {
            if (sync) {
              setSync(sync);
              window.location.reload();
              toast.success(
                t('sync_data.toast_saved'),
                {
                  position: toast.POSITION.BOTTOM_RIGHT,
                  toastId: 'data_sync_success',
                },
              );
            }
          },
          onErrorCallback: (response, errors) => setErrors({
            errors,
            response,
          }),
        },
      ),
    },
  );

  const [runSync, { isLoading: isLoadingRunSync }] = useMutation(
    api.syncs.useUpdate('git'),
    {
      onSuccess: (response: any) => onSuccess(
        response, {
          callback: ({ sync }) => {
            if (sync) {
              toast.success(
                t('sync_data.toast_success'),
                {
                  position: toast.POSITION.BOTTOM_RIGHT,
                  toastId: 'data_sync_success',
                },
              );
            }
          },
          onErrorCallback: (response, errors) => setErrors({
            errors,
            response,
          }),
        },
      ),
    },
  );

  const [deleteSecret] = useMutation(
    (name: string) => api.secrets.useDelete(name)(),
    {
      onSuccess: (response: any) => onSuccess(
        response, {
          callback: () => {
            fetchSyncs();
          },
          onErrorCallback: ({
            error: {
              errors,
              message,
            },
          }) => {
            // @ts-ignore
            setErrorMessages((errorMessages) => errorMessages.concat(message));
          },
        },
      ),
    },
  );

  const authType = useMemo(() => sync?.auth_type || AuthType.SSH, [sync?.auth_type]);
  const additionalGitFields = useMemo(() => {
    if (authType === AuthType.HTTPS) {
      return HTTPS_GIT_FIELDS;
    }
    return SSH_GIT_FIELDS;
  }, [authType]);
  
  const { data } = api.statuses.list();
  const requireUserAuthentication =
    useMemo(() => data?.statuses?.[0]?.require_user_authentication, [data]);

  const [selectedTab, setSelectedTab] = useState<TabType>();

  useEffect(() => {
    if (!selectedTab) {
      const defaultTabUUID = gitIntegrationEnabled ? TAB_GIT_INTEGRATION_UUID : TAB_GIT_SYNC_UUID;
      setSelectedTab(tabsToUse.find(({ uuid }) => uuid === defaultTabUUID));
    }
  }, [gitIntegrationEnabled, selectedTab, tabsToUse]);

  const userGitFields = useMemo(() => {
    let updateSettings: React.Dispatch<
      React.SetStateAction<SyncType | UserGitSettingsType>
    > = setSync;
    let settings: SyncType | UserGitSettingsType = sync;

    if (selectedTab?.uuid === TAB_GIT_INTEGRATION.uuid && requireUserAuthentication) {
      updateSettings = setUserGitSettings;
      settings = userGitSettings;
    }

    const secretValues = 
      Object.entries(settings || {})
        .filter(([field, value]) => (field.endsWith('_secret_name') && !!value));

    return (
      <>
        <form>
          {additionalGitFields.map(({
            autoComplete,
            disabled,
            label,
            labelDescription,
            required,
            type,
            uuid,
          }: SyncFieldType) => {
            const labelText = fieldLabelMapping[uuid] || label;
            const labelDescriptionText = fieldDescriptionMapping[uuid] || labelDescription;
            let description;
            const sshPublicKeyCommand = 'cat ~/.ssh/id_ed25519.pub | base64 | tr -d \\\\n && echo';
            const sshPrivateKeyCommand = 'cat ~/.ssh/id_ed25519 | base64 | tr -d \\\\n && echo';
            if (uuid === 'ssh_public_key') {
              description = (
                <Spacing mb={1}>
                  <Text small>
                    {t('sync_data.ssh_public_key_description_prefix')}{' '}
                    <Link
                      onClick={() => {
                        navigator.clipboard.writeText(sshPublicKeyCommand);
                        toast.success(
                          t('sync_data.copy_success'),
                          {
                            position: toast.POSITION.BOTTOM_RIGHT,
                            toastId: uuid,
                          },
                        );
                      }}
                      small
                    >
                      {sshPublicKeyCommand}
                    </Link>{' '}
                    {t('sync_data.ssh_public_key_description_suffix')}
                  </Text>
                </Spacing>
              );
            } else if (uuid === 'ssh_private_key') {
              description = (
                <Spacing mb={1}>
                  <Text small>
                    {t('sync_data.ssh_private_key_description_prefix')}{' '}
                    <Link
                      onClick={() => {
                        navigator.clipboard.writeText(sshPrivateKeyCommand);
                        toast.success(
                          t('sync_data.copy_success'),
                          {
                            position: toast.POSITION.BOTTOM_RIGHT,
                            toastId: uuid,
                          },
                        );
                      }}
                      small
                    >
                      {sshPrivateKeyCommand}
                    </Link>{' '}
                    {t('sync_data.ssh_private_key_description_suffix')}
                  </Text>
                </Spacing>
              );
            } else {
              description = labelDescriptionText && (
                <Spacing mb={1}>
                  <Text small>
                    {labelDescriptionText}
                  </Text>
                </Spacing>
              );
            }
            return (
              <Spacing key={uuid} mt={2}>
                {description}

                <TextInput  
                  autoComplete={autoComplete}
                  disabled={disabled}
                  label={labelText}
                  // @ts-ignore
                  onChange={e => {
                    updateSettings(prev => ({
                      ...prev,
                      [uuid]: e.target.value,
                    }));
                  }}
                  primary
                  required={required}
                  setContentOnMount
                  type={type}
                  value={settings?.[uuid] || ''}
                />
              </Spacing>
            );
          })}
        </form>
        <Spacing mb={1} mt={UNITS_BETWEEN_ITEMS_IN_SECTIONS}>
          <Headline level={5}>
            {t('sync_data.git_secrets')}
          </Headline>
        </Spacing>
        {secretValues && secretValues.length > 0 ? (
          secretValues.map(([_, value]) => (
            <VariableRow
              deleteVariable={() => deleteSecret(value)}
              hideEdit
              key={value}
              obfuscate
              variable={{
                uuid: value,
                value: 'placeholder',
              } as VariableType}
            />
          ))
        ) : (
          <Text>{t('sync_data.no_git_secrets', {
            tab: selectedTab ? tabLabelMapping[selectedTab?.uuid] : '',
          })}</Text>
        )}
      </>
    );
  }, [
    additionalGitFields,
    deleteSecret,
    requireUserAuthentication,
    selectedTab,
    setUserGitSettings,
    setSync,
    sync,
    tabLabelMapping,
    t,
    userGitSettings,
  ]);

  const q: { tab?: string } = queryFromUrl();
  useEffect(() => {
    if (q?.tab) {
      setSelectedTab(tabsToUse.find(({ uuid }) => uuid === q?.tab));
    }
  }, [q, tabsToUse]);

  const gitSyncFields = useMemo(() => (
    <>
      <Spacing mt={UNITS_BETWEEN_ITEMS_IN_SECTIONS}>
        <Text inline>
          {t('sync_data.learn_more_prefix')}{' '}
        </Text>
        <Link
          bold
          href="https://docs.mage.ai/production/data-sync/git-sync"
          openNewWindow>
          {t('sync_data.learn_more_link')}
        </Link>
      </Spacing>
      <Spacing mt={UNITS_BETWEEN_ITEMS_IN_SECTIONS}>
        <Text bold>
          {t('sync_data.branch_settings_title')}
        </Text>
      </Spacing>
      <form>
        {SYNC_FIELDS.map(({
          autoComplete,
          disabled,
          label,
          required,
          type,
          uuid,
        }: SyncFieldType) => (
          <Spacing key={uuid} mt={2}>
            <TextInput
              autoComplete={autoComplete}
              disabled={disabled}
              label={fieldLabelMapping[uuid] || label}
              // @ts-ignore
              onChange={e => {
                setSync(prev => ({
                  ...prev,
                  [uuid]: e.target.value,
                }));
              }}
              primary
              required={required}
              setContentOnMount
              type={type}
              value={sync?.[uuid] || ''}
            />
          </Spacing>
        ))}
      </form>
      <FlexContainer alignItems="center">
        <Spacing mt={2}>
          <Checkbox
            checked={sync?.sync_submodules}
            label={t('sync_data.include_submodules')}
            onClick={() => {
              setSync(prev => ({
                ...prev,
                sync_submodules: !sync?.sync_submodules,
              }));
            }}
          />
        </Spacing>
      </FlexContainer>
      <Spacing mt={2}>
        <Headline level={5}>
          {t('sync_data.additional_sync_settings')}
        </Headline>
      </Spacing>
      <FlexContainer alignItems="center">
        <Spacing mt={2}>
          <Checkbox
            checked={sync?.sync_on_pipeline_run}
            label={t('sync_data.sync_before_trigger')}
            onClick={() => {
              setSync(prev => ({
                ...prev,
                sync_on_pipeline_run: !sync?.sync_on_pipeline_run,
              }));
            }}
          />
        </Spacing>
      </FlexContainer>
      <FlexContainer alignItems="center">
        <Spacing mt={2}>
          <Checkbox
            checked={sync?.sync_on_start}
            label={t('sync_data.sync_on_start')}
            onClick={() => {
              setSync(prev => ({
                ...prev,
                sync_on_start: !sync?.sync_on_start,
              }));
            }}
          />
        </Spacing>
      </FlexContainer>
      <Spacing mt={UNITS_BETWEEN_ITEMS_IN_SECTIONS}>
        <Text bold>
          {t('sync_data.git_auth_settings')}
        </Text>
      </Spacing>
      {userGitFields}
    </>
  ), [fieldLabelMapping, sync, t, userGitFields]);

  const gitIntegrationFields = useMemo(() => (
    <>
      <Spacing mt={UNITS_BETWEEN_ITEMS_IN_SECTIONS}>
        {!gitIntegrationEnabled && (
          <Spacing mb={1}>
            <Text bold warning>
              {t('sync_data.git_integration_safeguard')}
            </Text>
          </Spacing>
        )}
        <Text bold>
          {t('sync_data.git_integration_recommendation_prefix')}{' '}
          <NextLink
            as="/version-control"
            href="/version-control"
          >
            <Link bold inline>{t('sync_data.version_control_app')}</Link>
          </NextLink>{' '}
          {t('sync_data.git_integration_recommendation_suffix')}
        </Text>
      </Spacing>
      <Spacing mt={UNITS_BETWEEN_ITEMS_IN_SECTIONS}>
        <Text>
          {t('sync_data.git_integration_fields_note')}
        </Text>
      </Spacing>
      {userGitFields}
    </>
  ), [gitIntegrationEnabled, t, userGitFields]);

  return (
    <SettingsDashboard
      uuidItemSelected={SECTION_ITEM_UUID_GIT_SETTINGS}
      uuidWorkspaceSelected={SECTION_UUID_WORKSPACE}
    >
      <Spacing
        p={PADDING_UNITS}
        style={{
          width: '600px',
        }}
      >
        <Headline>
          {t('sync_data.title')}
        </Headline>
        <Spacing mt={1}>
          <Text bold>
            {t('sync_data.auth_type')}
          </Text>
        </Spacing>
        <Spacing mt={1}>
          <Select
            compact
            label={t('sync_data.auth_type')}
            onChange={(e) => {
              const type = e.target.value;
              setSync(prev => ({
                ...prev,
                auth_type: type,
              }));
            }}
            value={authType}
          >
            {Object.entries(AuthType).map(([k, v]) => (
              <option key={v} value={v}>
                {authTypeLabelMapping[v] || k}
              </option>
            ))}
          </Select>
        </Spacing>
        <Spacing mt={UNITS_BETWEEN_ITEMS_IN_SECTIONS}>
          {authType === AuthType.SSH && (
            <Text bold>
              {t('sync_data.ssh_setup_notice_prefix')}{' '}
              <Link href="https://docs.mage.ai/development/git/configure#generate-ssh-token" openNewWindow>
                {t('sync_data.ssh_setup_link_text')}
              </Link>{' '}
              {t('sync_data.ssh_setup_notice_suffix')}
            </Text>
          )}
        </Spacing>

        <form>
          {GIT_FIELDS.map(({
            autoComplete,
            disabled,
            label,
            labelDescription,
            required,
            type,
            uuid,
          }: SyncFieldType) => (
            <Spacing key={uuid} mt={2}>
              {fieldDescriptionMapping[uuid] && (
                <Spacing mb={1}>
                  <Text small>
                    {fieldDescriptionMapping[uuid]}
                  </Text>
                </Spacing>
              )}
              <TextInput
                autoComplete={autoComplete}
                disabled={disabled}
                label={fieldLabelMapping[uuid] || label}
                // @ts-ignore
                onChange={e => {
                  setSync(prev => ({
                    ...prev,
                    [uuid]: e.target.value,
                  }));
                }}
                primary
                required={required}
                setContentOnMount
                type={type}
                value={sync?.[uuid] || ''}
              />
            </Spacing>
          ))}
        </form>
        
        <Spacing mt={UNITS_BETWEEN_ITEMS_IN_SECTIONS}>
          <Divider light />
        </Spacing>
        <ButtonTabs
          onClickTab={({ uuid }) => {
            goToWithQuery({ tab: uuid });
          }}
          selectedTabUUID={selectedTab?.uuid}
          tabs={tabsToUse}
          underlineStyle
        />
        <Divider light />

        <Spacing ml={2}>
          {TAB_GIT_SYNC_UUID === selectedTab?.uuid && gitSyncFields}

          {TAB_GIT_INTEGRATION_UUID === selectedTab?.uuid && gitIntegrationFields}
        </Spacing>

        <Spacing mt={UNITS_BETWEEN_SECTIONS}>
          <Button
            loading={isLoadingCreateSync}
            // @ts-ignore
            onClick={() => createSync({
              sync: {
                ...sync,
                user_git_settings: userGitSettings,
              },
            })}
            primary
          >
            {t('sync_data.save_button')}
          </Button>
        </Spacing>

        {errors && (
          <ClickOutside
            disableClickOutside
            isOpen
            onClickOutside={() => setErrors?.(null)}
          >
            <ErrorPopup
              {...errors}
              onClose={() => setErrors?.(null)}
            />
          </ClickOutside>
        )}
        
        {showSyncOperations && (
          <Spacing mt={UNITS_BETWEEN_SECTIONS}>
            <Headline>
              Synchronize code from remote repository
            </Headline>

            <Spacing mt={1}>
              <Text>
                Running the sync from this page will
                run a one time sync with the remote repository.
                <br />
                This may <Text bold danger inline>overwrite</Text> your
                existing data, so make sure you’ve committed or backed up your current changes.
              </Text>
              <Spacing mt={2} />
              <Text>
                Reset will tell Mage to try to clone your repository from remote. This will
                also <Text bold danger inline>overwrite</Text> all your local changes and 
                reset any settings you may have configured for your local Git repo. This may be
                helpful if you are having issues syncing your repository.
              </Text>
            </Spacing>

            <Spacing mt={2}>
              <FlexContainer>
                <Button
                  loading={isLoadingRunSync}
                  // @ts-ignore
                  onClick={() => runSync({
                    sync: {
                      action_type: 'sync_data',
                    },
                  })}
                  warning
                >
                  Synchronize code
                </Button>
                <Spacing ml={2}/>
                <Button
                  danger
                  loading={isLoadingRunSync}
                  // @ts-ignore
                  onClick={() => runSync({
                    sync: {
                      action_type: 'reset',
                    },
                  })}
                >
                  Reset repository
                </Button>
              </FlexContainer>
            </Spacing>
          </Spacing>
        )}
      </Spacing>
    </SettingsDashboard>
  );
}

SyncData.getInitialProps = async () => ({});

export default PrivateRoute(SyncData);
