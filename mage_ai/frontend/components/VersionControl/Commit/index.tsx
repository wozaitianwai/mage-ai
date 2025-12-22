import { useEffect, useMemo, useState } from 'react';
import { useMutation } from 'react-query';
import { useTranslation } from 'react-i18next';

import Accordion from '@oracle/components/Accordion';
import AccordionPanel from '@oracle/components/Accordion/AccordionPanel';
import Button from '@oracle/elements/Button';
import Divider from '@oracle/elements/Divider';
import FlexContainer from '@oracle/components/FlexContainer';
import GitBranchType, { GitRemoteType } from '@interfaces/GitBranchType';
import Headline from '@oracle/elements/Headline';
import Link from '@oracle/elements/Link';
import PullRequestType, { PullRequestPayloadType } from '@interfaces/PullRequestType';
import Select from '@oracle/elements/Inputs/Select';
import Spacing from '@oracle/elements/Spacing';
import Spinner from '@oracle/components/Spinner';
import Table from '@components/shared/Table';
import Text from '@oracle/elements/Text';
import TextArea from '@oracle/elements/Inputs/TextArea';
import TextInput from '@oracle/elements/Inputs/TextInput';
import api from '@api';
import {
  ACTION_PUSH,
  TAB_FILES,
} from '../constants';
import { Branch, Lightning, MultiShare, PaginateArrowLeft } from '@oracle/icons';
import {
  PADDING_UNITS,
  UNIT,
  UNITS_BETWEEN_ITEMS_IN_SECTIONS,
  UNITS_BETWEEN_SECTIONS,
} from '@oracle/styles/units/spacing';
import { onSuccess } from '@api/utils/response';

const EMPTY_PULL_REQUEST = {
  base_branch: null,
  body: null,
  compare_branch: null,
  repository: null,
  title: null,
};

type CommitProps = {
  actionRemoteName: string;
  branch: GitBranchType;
  branches: GitBranchType[];
  fetchBranch: () => void;
  loading?: boolean;
  modifiedFiles: {
    [fullPath: string]: boolean;
  };
  remotes: GitRemoteType[];
  repositories: {
    name: string;
    url: string;
  }[];
  repositoryName: string;
  setActionRemoteName: (actionRemoteName: string) => void;
  setRepositoryName: (repositoryName: string) => void;
  showError: (opts: any) => void;
  stagedFiles: {
    [fullPath: string]: boolean;
  };
};

function Commit({
  actionRemoteName,
  branch,
  branches,
  fetchBranch,
  loading,
  remotes,
  repositories,
  repositoryName,
  setActionRemoteName,
  setRepositoryName,
  showError,
}: CommitProps) {
  const { t } = useTranslation('common');
  const [actionBranchName, setActionBranchName] = useState<string>(branch?.name || '');
  const [actionError, setActionError] = useState<string>(null);
  const [actionProgress, setActionProgress] = useState<string>(null);
  const [pullRequest, setPullRequest] = useState<PullRequestPayloadType>(EMPTY_PULL_REQUEST);

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
              setActionError(null);
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

  const repositoryUrl = useMemo(
    () => repositories?.find(({ name }) => name === repositoryName)?.url,
    [
      repositories,
      repositoryName,
    ],
  );

  const { data: dataPullRequests, mutate: fetchPullRequests } = api.pull_requests.list({
    remote_url: repositoryUrl,
    repository: repositoryName,
  }, {}, {
    pauseFetch: !repositoryName,
  });
  const pullRequests: PullRequestType[] =
    useMemo(() => dataPullRequests?.pull_requests || [], [dataPullRequests]);
  const pullRequestsMemo = useMemo(() => (
    <Table
      columnFlex={[null, null, null, null]}
      columns={[
        {
          label: () => t('version_control.title_label'),
          uuid: 'Title',
        },
        {
          label: () => t('version_control.author'),
          uuid: 'Author',
        },
        {
          label: () => t('version_control.created'),
          uuid: 'Created',
        },
        {
          label: () => t('version_control.last_modified'),
          uuid: 'last_modified',
        },
      ]}
      onClickRow={(rowIndex: number) => {
        const url = pullRequests?.[rowIndex]?.url;

        if (url && typeof window !== 'undefined') {
          window.open(url, '_blank');
        }
      }}
      rows={pullRequests?.map(({
        created_at: createdAt,
        last_modified: lastModified,
        title,
        url,
        user,
      }) => [
        <Link
          default
          href={url}
          key="title"
          monospace
          openNewWindow
          small
        >
          {title}
        </Link>,
        <Text default key="user" monospace small>
          {user}
        </Text>,
        <Text default key="createdAt" monospace small>
          {createdAt}
        </Text>,
        <Text default key="lastModified" monospace small>
          {lastModified || t('common.not_applicable')}
        </Text>,
      ])}
      uuid="pull-requests"
    />
  ), [pullRequests, t]);

  const { data: dataGitBranches } = api.git_custom_branches.list({
    remote_url: repositoryUrl,
    repository: repositoryName,
  }, {}, {
    pauseFetch: !repositoryName,
  });
  const branchesForRepository: GitBranchType[] =
    useMemo(() => dataGitBranches?.git_custom_branches || [], [dataGitBranches]);

  useEffect(() => {
    if (!pullRequest?.compare_branch && branchesForRepository?.find(({ name }) => name === branch?.name)) {
      // @ts-ignore
      setPullRequest(prev => ({
        ...prev,
        compare_branch: branch?.name,
      }));
    }
  }, [
    branch,
    branchesForRepository,
    pullRequest,
  ]);

  const [createPullRequest, { isLoading: isLoadingCreatePullRequest }] = useMutation(
    api.pull_requests.useCreate(),
    {
      onSuccess: (response: any) => onSuccess(
        response, {
          callback: () => {
            fetchPullRequests();
            setPullRequest(EMPTY_PULL_REQUEST);
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
    <>
      <Spacing mb={UNITS_BETWEEN_SECTIONS}>
        <Spacing mb={1}>
          <Headline>
            {t('version_control.push_action')}
          </Headline>
        </Spacing>

        <Spacing mt={UNITS_BETWEEN_ITEMS_IN_SECTIONS}>
          <FlexContainer>
            <div>
              <Spacing mb={1}>
                <Text bold muted>
                  {t('version_control.remote')}
                </Text>
              </Spacing>

              {loading && <Spinner inverted />}
              {!loading && (
                <Select
                  beforeIcon={<MultiShare />}
                  beforeIconSize={UNIT * 1.5}
                  monospace
                  onChange={e => setActionRemoteName(e.target.value)}
                  placeholder={t('version_control.choose_remote')}
                  value={actionRemoteName || ''}
                >
                  {remotes?.map(({ name }) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </Select>
              )}
            </div>

            <Spacing mr={1} />

            <div>
              <Spacing mb={1}>
                <Text bold muted>
                  {t('version_control.branch')}
                </Text>
              </Spacing>

              <Select
                beforeIcon={<Branch />}
                beforeIconSize={UNIT * 1.5}
                monospace
                onChange={e => setActionBranchName(e.target.value)}
                placeholder={t('version_control.choose_branch')}
                value={actionBranchName || ''}
              >
                <option value="" />
                {branches?.map(({ name }) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
            </div>
          </FlexContainer>

          <Spacing mt={PADDING_UNITS}>
            <Button
              beforeIcon={<Lightning size={UNIT * 2} />}
              disabled={!actionRemoteName || !actionBranchName}
              loading={isLoadingAction}
              onClick={() => {
                setActionProgress(null);
                // @ts-ignore
                actionGitBranch({
                  git_custom_branch: {
                    action_payload: {
                      branch: actionBranchName,
                      remote: actionRemoteName,
                    },
                    action_type: ACTION_PUSH,
                  },
                });
              }}
              primary
            >
              {t('version_control.push_action')} {actionRemoteName} {actionRemoteName && actionBranchName}
            </Button>
          </Spacing>

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

      <Spacing mb={UNITS_BETWEEN_SECTIONS}>
        <Spacing mb={1}>
          <Headline>
            {t('version_control.create_pull_request')}
          </Headline>
        </Spacing>

        <Spacing mt={UNITS_BETWEEN_ITEMS_IN_SECTIONS}>
          {loading && (
            <Spinner inverted />
          )}

          {!loading && (
            <>
              <FlexContainer>
                <div>
                  <Spacing mb={1}>
                    <Text bold muted>
                      {t('version_control.repository')}
                    </Text>
                  </Spacing>

                  <Select
                    monospace
                    onChange={e => setRepositoryName(e.target.value)}
                    placeholder={t('version_control.choose_repository')}
                    value={repositoryName || ''}
                  >
                    {repositories?.map(({
                      name,
                    }) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </Select>
                </div>

                <Spacing mr={1} />

                <div>
                  <Spacing mb={1}>
                    <Text bold muted>
                      {t('version_control.base_branch')}
                    </Text>
                  </Spacing>

                  {repositoryName && !dataGitBranches && <Spinner inverted />}
                  {(!repositoryName || dataGitBranches) && (
                    <Select
                      beforeIcon={<Branch />}
                      beforeIconSize={UNIT * 1.5}
                      disabled={!repositoryName}
                      monospace
                      // @ts-ignore
                      onChange={e => setPullRequest(prev => ({
                        ...prev,
                        base_branch: e.target.value,
                      }))}
                      placeholder={t('version_control.choose_branch')}
                      value={pullRequest?.base_branch || ''}
                    >
                      {branchesForRepository?.map(({ name }) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </Select>
                  )}
                </div>

                <Spacing mr={1} />

                <div>
                  <Spacing mb={1}>
                    <Text bold muted>
                      {t('version_control.compare_branch')}
                    </Text>
                  </Spacing>

                  {repositoryName && !dataGitBranches && <Spinner inverted />}
                  {(!repositoryName || dataGitBranches || pullRequest?.compare_branch) && (
                    <Select
                      beforeIcon={<Branch />}
                      beforeIconSize={UNIT * 1.5}
                      disabled={!repositoryName}
                      monospace
                      // @ts-ignore
                      onChange={e => setPullRequest(prev => ({
                        ...prev,
                        compare_branch: e.target.value,
                      }))}
                      placeholder={t('version_control.choose_branch')}
                      value={pullRequest?.compare_branch || ''}
                    >
                      {!branchesForRepository?.length && pullRequest?.compare_branch && (
                        <option value={pullRequest?.compare_branch}>
                          {pullRequest?.compare_branch}
                        </option>
                      )}
                      {branchesForRepository?.map(({ name }) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </Select>
                  )}
                </div>
              </FlexContainer>

              <Spacing mt={1}>
                <TextInput
                  label={t('version_control.title_label')}
                  monospace
                  // @ts-ignore
                  onChange={e => setPullRequest(prev => ({
                    ...prev,
                    title: e.target.value,
                  }))}
                  value={pullRequest?.title || ''}
                />
              </Spacing>

              <Spacing mt={1}>
                <TextArea
                  label={t('version_control.description_label')}
                  monospace
                  // @ts-ignore
                  onChange={e => setPullRequest(prev => ({
                    ...prev,
                    body: e.target.value,
                  }))}
                  value={pullRequest?.body || ''}
                />
              </Spacing>

              <Spacing mt={PADDING_UNITS}>
                <Button
                  beforeIcon={<Lightning size={UNIT * 2} />}
                  disabled={!repositoryName
                    || !pullRequest?.title
                    || !pullRequest?.base_branch
                    || !pullRequest?.compare_branch
                  }
                  loading={isLoadingCreatePullRequest}
                  onClick={() => {
                    // @ts-ignore
                    createPullRequest({
                      pull_request: {
                        ...pullRequest,
                        remote_url: repositoryUrl,
                        repository: repositoryName,
                      },
                    });
                  }}
                  primary
                >
                  {t('version_control.create_pull_request')}
                </Button>
              </Spacing>
            </>
          )}
        </Spacing>

        <Spacing mt={UNITS_BETWEEN_ITEMS_IN_SECTIONS}>
          <Accordion visibleMapping={{ 0: !repositoryName }}>
            <AccordionPanel
              noPaddingContent
              title={dataPullRequests
                ? `${t('version_control.pull_requests')} (${pullRequests?.length})`
                : t('version_control.pull_requests')
              }
            >
              {!repositoryName && (
                <Spacing p={PADDING_UNITS}>
                  <Text muted>
                    {t('version_control.please_select_repository')}
                  </Text>
                </Spacing>
              )}

              {repositoryName && (
                <>
                  {!dataPullRequests && (
                    <Spacing p={PADDING_UNITS}>
                      <Spinner inverted />
                    </Spacing>
                  )}
                  {dataPullRequests && pullRequestsMemo}
                </>
              )}
            </AccordionPanel>
          </Accordion>
        </Spacing>
      </Spacing>

      <Spacing mb={UNITS_BETWEEN_SECTIONS}>
        <Spacing mb={UNITS_BETWEEN_SECTIONS}>
          <Divider light />
        </Spacing>

        <FlexContainer>
          <Button
            beforeIcon={<PaginateArrowLeft />}
            linkProps={{
              href: `/version-control?tab=${TAB_FILES.uuid}`,
            }}
            noBackground
            noHoverUnderline
            sameColorAsText
          >
            {t('version_control.tabs.commit')}
          </Button>
        </FlexContainer>
      </Spacing>
    </>
  );
}

export default Commit;
