import NextLink from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from 'react-query';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

import Accordion from '@oracle/components/Accordion';
import AccordionPanel from '@oracle/components/Accordion/AccordionPanel';
import Authentication from './Authentication';
import Button from '@oracle/elements/Button';
import Divider from '@oracle/elements/Divider';
import Flex from '@oracle/components/Flex';
import FlexContainer from '@oracle/components/FlexContainer';
import GitBranchType, { GitRemoteType } from '@interfaces/GitBranchType';
import Headline from '@oracle/elements/Headline';
import Link from '@oracle/elements/Link';
import Select from '@oracle/elements/Inputs/Select';
import Spacing from '@oracle/elements/Spacing';
import Spinner from '@oracle/components/Spinner';
import Table from '@components/shared/Table';
import Text from '@oracle/elements/Text';
import TextInput from '@oracle/elements/Inputs/TextInput';
import api from '@api';
import useProject from '@utils/models/project/useProject';
import {
  ACTION_CLONE,
  ACTION_FETCH,
  ACTION_PULL,
  ACTION_RESET,
  ACTION_RESET_HARD,
  ADDITIONAL_ARGUMENTS,
} from '../constants';
import {
  Add,
  Branch,
  ChevronRight,
  Lightning,
  MultiShare,
  PaginateArrowRight,
  Trash,
} from '@oracle/icons';
import { OauthProviderEnum } from '@interfaces/OauthType';
import {
  PADDING_UNITS,
  UNIT,
  UNITS_BETWEEN_ITEMS_IN_SECTIONS,
  UNITS_BETWEEN_SECTIONS,
} from '@oracle/styles/units/spacing';
import { TAB_BRANCHES } from '../constants';
import { capitalizeRemoveUnderscoreLower } from '@utils/string';
import { onSuccess } from '@api/utils/response';
import { queryFromUrl } from '@utils/url';

type RemoteProps = {
  actionRemoteName: string;
  branch: GitBranchType;
  fetchBranch: () => void;
  loading?: boolean;
  remotes: GitRemoteType[];
  setActionRemoteName: (actionRemoteName: string) => void;
  showError: (opts: any) => void;
};

function Remote({
  actionRemoteName,
  branch,
  fetchBranch,
  loading,
  remotes,
  setActionRemoteName,
  showError,
}: RemoteProps) {
  const router = useRouter();
  const { t } = useTranslation('common');

  const { project } = useProject();

  const refInputRepoPath = useRef(null);

  const [actionBranchName, setActionBranchName] = useState<string>(null);
  const [actionError, setActionError] = useState<string>(null);
  const [actionName, setActionName] = useState<string>(null);
  const [actionProgress, setActionProgress] = useState<string>(null);
  const [actionArgument, setActionArgument] = useState<string>(null);
  const [editRepoPathActive, setEditRepoPathActive] = useState<boolean>(false);
  const [remoteNameActive, setRemoteNameActive] = useState<string>(null);
  const [remoteNameNew, setRemoteNameNew] = useState<string>('');
  const [remoteURLNew, setRemoteURLNew] = useState<string>('');
  const [repoPath, setRepoPath] = useState<string>(null);

  const gitInitialized = useMemo(() => !!branch?.name, [branch]);

  useEffect(() => {
    if (!repoPath && (branch?.sync_config?.repo_path || project?.repo_path)) {
      setRepoPath(branch?.sync_config?.repo_path || project?.repo_path);
    }
  }, [branch, project, repoPath]);

  const branches = useMemo(() => remotes?.find(({
    name,
  }) => name === actionRemoteName)?.refs?.map((ref) => {
    const {
      name,
    } = ref;
    return {
      name: name.substring(actionRemoteName.length + 1),
    };
  }), [
    actionRemoteName,
    remotes,
  ]);

  const [createSyncs, { isLoading: isLoadingCreateSyncs }] = useMutation(
    api.syncs.useCreate(),
    {
      onSuccess: (response: any) => onSuccess(
        response, {
          callback: () => {
            fetchBranch();
            setEditRepoPathActive(false);
          },
          onErrorCallback: (response, errors) => showError({
            errors,
            response,
          }),
        },
      ),
    },
  );

  const [actionGitBranch, { isLoading: isLoadingAction }] = useMutation(
    api.git_custom_branches.useUpdate(encodeURIComponent(branch?.name)),
    {
      onSuccess: (response: any) => onSuccess(
        response, {
          callback: ({
            git_custom_branch: {
              error,
              progress,
            },
          }) => {
            if (error) {
              setActionError(error);
              setActionProgress(null);
            } else {
              fetchBranch();
              setActionBranchName(null);
              setActionError(null);
              setActionName(null);
              setActionProgress(progress);
            }
          },
          onErrorCallback: (response, errors) => showError({
            errors,
            response,
          }),
        },
      ),
    },
  );

  const [updateGitBranch, { isLoading: isLoadingUpdate }] = useMutation(
    api.git_custom_branches.useUpdate(encodeURIComponent(branch?.name)),
    {
      onSuccess: (response: any) => onSuccess(
        response, {
          callback: () => {
            fetchBranch();
            setRemoteNameNew('');
            setRemoteURLNew('');
          },
          onErrorCallback: (response, errors) => showError({
            errors,
            response,
          }),
        },
      ),
    },
  );

  const [removeRemote, { isLoading: isLoadingRemoveRemote }] = useMutation(
    api.git_custom_branches.useUpdate(encodeURIComponent(branch?.name)),
    {
      onSuccess: (response: any) => onSuccess(
        response, {
          callback: () => {
            fetchBranch();
            setRemoteNameActive(null);
          },
          onErrorCallback: (response, errors) => {
            setRemoteNameActive(null);
            showError({
              errors,
              response,
            });
          },
        },
      ),
    },
  );

  const [createOauth, { isLoading: isLoadingCreateOauth }] = useMutation(
    api.oauths.useCreate(),
    {
      onSuccess: (response: any) => onSuccess(
        response, {
          callback: () => window.location.href = `${router?.basePath}/version-control`,
          onErrorCallback: (response, errors) => {
            showError({
              errors,
              response,
            });
          },
        },
      ),
    },
  );
  const {
    access_token: accessTokenFromURL,
    provider: providerFromURL,
    refresh_token: refreshTokenFromURL,
    expires_in: expiresIn,
  } = queryFromUrl() || {};
  useEffect(() => {
    if (accessTokenFromURL) {
      // @ts-ignore
      createOauth({
        oauth: {
          expires_in: expiresIn,
          provider: providerFromURL || OauthProviderEnum.GITHUB,
          refresh_token: refreshTokenFromURL,
          token: accessTokenFromURL,
        },
      });
    }
  }, [
    accessTokenFromURL,
    createOauth,
    expiresIn,
    providerFromURL,
    refreshTokenFromURL,
  ]);

  const remotesMemo = useMemo(() => remotes?.map(({
    name,
    refs,
    urls,
  }) => (
    <Spacing
      key={name}
      mt={UNITS_BETWEEN_ITEMS_IN_SECTIONS}
    >
      <Spacing mb={1}>
        <FlexContainer alignItems="center" justifyContent="space-between">
          <Flex alignItems="center">
            <Text bold>
              {name}
            </Text>

            <Spacing mx={1}>
              <ChevronRight muted />
            </Spacing>

            {urls?.map(url => (
              <Spacing key={url} mr={1}>
                <Text default monospace small>
                  {url}
                </Text>
              </Spacing>
            ))}
          </Flex>

          <Spacing mr={1} />

          <Button
            compact
            disabled={isLoadingRemoveRemote && remoteNameActive !== name}
            iconOnly
            loading={isLoadingRemoveRemote && remoteNameActive === name}
            noBackground
            onClick={() => {
              if (typeof window !== 'undefined'
                && typeof location !== 'undefined'
                && window.confirm(
                  t('version_control.remove_remote_confirm', { name }),
                )
              ) {
                setRemoteNameActive(name);
                // @ts-ignore
                removeRemote({
                  git_custom_branch: {
                    action_type: 'remove_remote',
                    action_payload: {
                      name,
                    },
                  },
                }).then(() => {
                  if (actionRemoteName === name) {
                    setActionRemoteName(null);
                  }
                });
              }
            }}
            small
            title={`Remote remote ${name}`}
          >
            <Trash />
          </Button>
        </FlexContainer>
      </Spacing>

      <Accordion>
        <AccordionPanel
          noPaddingContent
          smallTitle
            title={t('version_control.refs_title', { count: refs?.length || 0 })}
        >
          {refs?.length === 0 && (
            <Spacing p={PADDING_UNITS}>
              <Text muted>
                {t('version_control.remote_no_refs')}
              </Text>
            </Spacing>
          )}

          {refs?.length >= 1 && (
            <Table
              columnFlex={[1, 1, 1]}
              columns={[
                {
                  uuid: t('version_control.ref'),
                },
                {
                  uuid: t('version_control.author'),
                },
                {
                  uuid: t('version_control.date'),
                },
                {
                  uuid: t('version_control.message'),
                },
              ]}
              rows={refs.map(({
                commit,
                name: nameOfRef,
              }) => [
                <Text default key="ref-name" monospace small>
                  {nameOfRef}
                </Text>,
                <Text default key="author" monospace small>
                  {commit?.author?.name}
                </Text>,
                <Text default key="date" monospace small>
                  {commit?.date}
                </Text>,
                <Text default key="message" monospace small>
                  {commit?.message}
                </Text>,
              ])}
              uuid="git-branch-remotes-refs"
            />
          )}
        </AccordionPanel>
      </Accordion>

      <Spacing mt={UNITS_BETWEEN_ITEMS_IN_SECTIONS}>
        <Divider light />
      </Spacing>
    </Spacing>
  )), [
    isLoadingRemoveRemote,
    remoteNameActive,
    remotes,
    removeRemote,
  ]);

  return (
    <>
      <Spacing mb={UNITS_BETWEEN_SECTIONS}>
        <Headline>
          {t('version_control.setup')}
        </Headline>

        <Spacing mt={UNITS_BETWEEN_ITEMS_IN_SECTIONS}>
          <Spacing mb={1}>
            <Text bold large>
              {gitInitialized
                ? t('version_control.git_init_directory')
                : t('version_control.initialize_git_directory')}
            </Text>

            {!gitInitialized && (
              <Text muted>
                {t('version_control.enter_directory_hint')}
              </Text>
            )}

            {gitInitialized && (
              <Text muted>
                {t('version_control.git_initialized_hint')}
              </Text>
            )}
          </Spacing>

          <FlexContainer alignItems="center">
            <TextInput
              disabled={gitInitialized && !editRepoPathActive}
              fullWidth
              label={t('version_control.git_directory')}
              maxWidth={400}
              monospace
              onChange={e => setRepoPath(e.target.value)}
              ref={refInputRepoPath}
              value={repoPath || ''}
            />

            <Spacing mr={1} />

            {(!gitInitialized || editRepoPathActive) && (
              <>
                <Button
                  compact
                  disabled={!gitInitialized && !repoPath}
                  loading={isLoadingCreateSyncs}
                  onClick={() => {
                    // @ts-ignore
                    createSyncs({
                      sync: {
                        repo_path: repoPath,
                      },
                    });
                  }}
                  primary
                  small
                >
                  {t('preferences.save_settings')}
                </Button>

                {gitInitialized && (
                  <>
                    <Spacing mr={1} />

                    <Link
                      onClick={() => setEditRepoPathActive(false)}
                      preventDefault
                      sameColorAsText
                      small
                    >
                      {t('preferences.cancel')}
                    </Link>
                  </>
                )}
              </>
            )}

            {gitInitialized && !editRepoPathActive && (
              <Link
                onClick={() => {
                  setEditRepoPathActive(true);
                  setTimeout(() => refInputRepoPath?.current?.focus(), 1);
                }}
                preventDefault
                sameColorAsText
                small
              >
                Edit
              </Link>
            )}
          </FlexContainer>
        </Spacing>
      </Spacing>

      <Spacing mb={UNITS_BETWEEN_SECTIONS}>
        <Authentication
          branch={branch}
          isLoadingCreateOauth={isLoadingCreateOauth}
          showError={showError}
        />
      </Spacing>

      {gitInitialized && (
        <>
          <Spacing mb={UNITS_BETWEEN_SECTIONS}>
            <Headline>
              {t('version_control.remotes')}{!loading && remotes ? ` (${remotes?.length})` : ''}
            </Headline>

            {loading && (
              <Spacing mt={UNITS_BETWEEN_ITEMS_IN_SECTIONS}>
                <Spinner inverted />
              </Spacing>
            )}
            {!loading && remotesMemo}

            <Spacing mt={UNITS_BETWEEN_ITEMS_IN_SECTIONS}>
              <FlexContainer alignItems="flex-start">
                <TextInput
                  label={t('version_control.new_remote_name')}
                  monospace
                  onChange={e => setRemoteNameNew(e?.target?.value)}
                  value={remoteNameNew || ''}
                />

                <Spacing mr={1} />

                <FlexContainer flexDirection="column">
                  <TextInput
                    label={t('version_control.remote_url')}
                    monospace
                    onChange={e => setRemoteURLNew(e?.target?.value)}
                    value={remoteURLNew || ''}
                  />

                  <Spacing mt={1}>
                    <Text muted small>
                      {t('version_control.remote_url_hint')}
                    </Text>
                  </Spacing>
                </FlexContainer>

                <Spacing mr={1} />

                <Button
                  beforeIcon={<Add size={UNIT * 2} />}
                  disabled={!remoteNameNew || !remoteURLNew}
                  loading={isLoadingUpdate}
                  onClick={() => {
                    // @ts-ignore
                    updateGitBranch({
                      git_custom_branch: {
                        action_type: 'add_remote',
                        action_payload: {
                          name: remoteNameNew,
                          url: remoteURLNew,
                        },
                      },
                    });
                  }}
                  primary
                >
                  {t('version_control.create_new_remote')}
                </Button>
              </FlexContainer>
            </Spacing>
          </Spacing>

          <Spacing mb={UNITS_BETWEEN_SECTIONS}>
            <Headline>
              {t('version_control.actions')}
            </Headline>

            <Spacing mt={UNITS_BETWEEN_ITEMS_IN_SECTIONS}>
              <Spacing mb={UNITS_BETWEEN_ITEMS_IN_SECTIONS}>
                <Spacing mb={1}>
                <Text bold muted>
                  {t('version_control.current_branch')}
                </Text>
                </Spacing>

                {branch?.name && (
                  <FlexContainer alignItems="center">
                    <Text monospace>
                      {branch?.name}
                    </Text>

                    <Spacing mr={PADDING_UNITS} />

                    <NextLink
                      href={`/version-control?tab=${TAB_BRANCHES.uuid}`}
                      passHref
                  >
                    <Link small>
                      {t('version_control.switch_branch')}
                    </Link>
                  </NextLink>
                </FlexContainer>
              )}
              </Spacing>

              <FlexContainer>
                <Select
                  onChange={(e) => setActionName(e.target.value)}
                  placeholder={t('version_control.action')}
                  value={actionName || ''}
                >
                  <option value={ACTION_FETCH}>
                    {capitalizeRemoveUnderscoreLower(ACTION_FETCH)}
                  </option>
                  <option value={ACTION_PULL}>
                    {capitalizeRemoveUnderscoreLower(ACTION_PULL)}
                  </option>
                  <option value={ACTION_RESET}>
                    {capitalizeRemoveUnderscoreLower(ACTION_RESET_HARD)}
                  </option>
                  <option value={ACTION_CLONE}>
                    {capitalizeRemoveUnderscoreLower(ACTION_CLONE)}
                  </option>
                </Select>

                <Spacing mr={1} />

                <Select
                  beforeIcon={<MultiShare />}
                  beforeIconSize={UNIT * 1.5}
                  monospace
                  onChange={e => setActionRemoteName(e.target.value)}
                  placeholder={t('version_control.remote')}
                  value={actionRemoteName || ''}
                >
                  {remotes?.map(({ name }) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </Select>
                
                {[ACTION_PULL, ACTION_RESET_HARD].includes(actionName) && (
                  <Spacing ml={1}>
                    <Select
                      beforeIcon={<Branch />}
                      beforeIconSize={UNIT * 1.5}
                      monospace
                      onChange={e => setActionBranchName(e.target.value)}
                      value={actionBranchName || ''}
                    >
                      <option value="">{t('version_control.all_branches')}</option>
                      {branches?.map(({ name }) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </Select>
                  </Spacing>
                )}

                {ADDITIONAL_ARGUMENTS[actionName] && (
                  <Spacing ml={1}>
                    <Select
                      label={t('version_control.additional_argument')}
                      monospace
                      onChange={e => setActionArgument(e.target.value)}
                      value={actionArgument || ''}
                    >
                      {ADDITIONAL_ARGUMENTS[actionName]?.map((name) => (
                        <option key={name} value={name}>
                          {capitalizeRemoveUnderscoreLower(name)}
                        </option>
                      ))}
                    </Select>
                  </Spacing>
                )}
              </FlexContainer>

              {ACTION_CLONE === actionName && (
                <Spacing mt={PADDING_UNITS}>
                  <Text muted small>
                    Cloning a branch will copy all the files and folders from the remote repository
                    and put them into the Git directory configured above:
                    <br />
                    <Text default inline monospace small>
                      {branch?.sync_config?.repo_path}
                    </Text>.
                  </Text>

                  <Spacing mt={1}>
                    <Text muted small>
                      Cloning won’t automatically create a folder that is named after the remote repository.
                    </Text>
                  </Spacing>

                  <Spacing mt={1}>
                    <Text muted small>
                      For example, if you have a file named <Text default inline monospace small>
                        magic.py
                      </Text> in a remote repository named <Text default inline monospace small>
                        project_romeo
                      </Text>
                      <br />
                      then that file will be cloned here <Text default inline monospace small>
                        {branch?.sync_config?.repo_path}/magic.py
                      </Text>
                      <br />
                      as opposed to <Text default inline monospace small>
                        {branch?.sync_config?.repo_path}/project_romeo/magic.py
                      </Text>.
                    </Text>
                  </Spacing>

                  <Spacing mt={1}>
                    <Text muted small>
                      If you want to clone the content of a remote repository into a folder
                      named after the remote repository, then change the Git init directoy above to
                      <br />
                      <Text default inline monospace small>
                        {branch?.sync_config?.repo_path}/<Text inline monospace small>
                          [remote repository name]
                        </Text>
                      </Text>
                    </Text>
                  </Spacing>
                </Spacing>
              )}

              <Spacing mt={PADDING_UNITS}>
                <Button
                  beforeIcon={<Lightning size={UNIT * 2} />}
                  disabled={!actionName || !actionRemoteName}
                  loading={isLoadingAction}
                  onClick={() => {
                    setActionProgress(null);
                    if (actionName !== ACTION_CLONE || (
                        typeof window !== 'undefined'
                        && typeof location !== 'undefined'
                        && window.confirm(
                          `Are you sure you want to clone remote ${actionRemoteName}? This will ` +
                          'overwrite all your local changes and may reset any settings you may ' + 
                          'have configured for your local Git repo. This action cannot be undone.',
                        )
                      )
                    ) {
                      // @ts-ignore
                      actionGitBranch({
                        git_custom_branch: {
                          action_payload: {
                            arg: actionArgument,
                            branch: actionBranchName,
                            remote: actionRemoteName,
                          },
                          action_type: actionName,
                        },
                      });
                    }
                  }}
                  primary
                >
                  {actionName ? capitalizeRemoveUnderscoreLower(actionName) : 'Execute action'}
                </Button>

                {(actionProgress || actionError) && (
                  <Spacing mt={PADDING_UNITS}>
                    <Text
                      danger={!!actionError}
                      default={!!actionProgress}
                      monospace
                      preWrap
                    >
                      {actionProgress || actionError}
                    </Text>
                  </Spacing>
                )}
              </Spacing>
            </Spacing>
          </Spacing>

          <Spacing mb={UNITS_BETWEEN_SECTIONS}>
            <Spacing mb={UNITS_BETWEEN_SECTIONS}>
              <Divider light />
            </Spacing>

            <FlexContainer>
              <Button
                afterIcon={<PaginateArrowRight />}
                linkProps={{
                  href: `/version-control?tab=${TAB_BRANCHES.uuid}`,
                }}
                noHoverUnderline
                sameColorAsText
                secondary
              >
                {t('version_control.next_tab', { tab: t('version_control.branches') })}
              </Button>
            </FlexContainer>
          </Spacing>
        </>
      )}
    </>
  );
}

export default Remote;
