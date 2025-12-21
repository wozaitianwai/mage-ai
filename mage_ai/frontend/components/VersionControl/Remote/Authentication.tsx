import React, { useMemo } from 'react';
import { useMutation } from 'react-query';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

import BitbucketWithText from '@oracle/icons/custom/BitbucketWithText';
import Button from '@oracle/elements/Button';
import Divider from '@oracle/elements/Divider';
import Flex from '@oracle/components/Flex';
import FlexContainer from '@oracle/components/FlexContainer';
import GitBranchType from '@interfaces/GitBranchType';
import Headline from '@oracle/elements/Headline';
import OauthType, { OauthProviderEnum } from '@interfaces/OauthType';
import Spacing from '@oracle/elements/Spacing';
import Text from '@oracle/elements/Text';
import api from '@api';
import { DevOpsWithText, GitHubWithTextIcon, GitLabWithTextIcon } from '@oracle/icons';
import { UNIT, UNITS_BETWEEN_ITEMS_IN_SECTIONS, UNITS_BETWEEN_SECTIONS } from '@oracle/styles/units/spacing';
import { onSuccess } from '@api/utils/response';
import { queryFromUrl } from '@utils/url';
import { set } from '@storage/localStorage';

const PROVIDER_TO_ICON_MAPPING = {
  [OauthProviderEnum.AZURE_DEVOPS]: DevOpsWithText,
  [OauthProviderEnum.BITBUCKET]: BitbucketWithText,
  [OauthProviderEnum.GITHUB]: GitHubWithTextIcon,
  [OauthProviderEnum.GITLAB]: GitLabWithTextIcon,
};

type ProviderProps = {
  isLoadingCreateOauth: boolean;
  oauth: OauthType;
  provider: OauthProviderEnum | string;
  showError: (opts: any) => void;
};

type AuthenticationProps = {
  branch: GitBranchType;
  isLoadingCreateOauth: boolean;
  showError: (opts: any) => void;
};

function Provider({
  isLoadingCreateOauth,
  oauth,
  provider,
  showError,
}: ProviderProps) {
  const router = useRouter();
  const { t } = useTranslation('common');

  const [updateOauth, { isLoading: isLoadingUpdateOauth }] = useMutation(
    api.oauths.useUpdate(provider),
    {
      onSuccess: (response: any) => onSuccess(
        response, {
          callback: () => window.location.href = window.location.href.split('?')[0],
          onErrorCallback: (response, errors) => showError({
            errors,
            response,
          }),
        },
      ),
    },
  );

  const Icon = PROVIDER_TO_ICON_MAPPING[provider];

  return (
    <FlexContainer justifyContent="space-between">
      <Flex>
        <Icon size={UNIT * 12} />
      </Flex>
      <Flex alignItems="center">
        {oauth?.authenticated ? (
          <Button
            loading={isLoadingUpdateOauth}
            // @ts-ignore
            onClick={() => updateOauth({
              oauth: {
                action_type: 'reset',
              },
            })}
            warning
          >
            {t('version_control.reset')}
          </Button>
        ) : (
          <Button
            loading={isLoadingCreateOauth}
            onClick={() => {
              const url = oauth?.url;
              const q = queryFromUrl(url);
              const state = q.state;
              set(state, oauth?.redirect_query_params || {});
              router.push(url);
            }}
            primary
          >
            {t('version_control.authenticate')}
          </Button>
        )}
      </Flex>
    </FlexContainer>
  );
}

function Authentication({
  branch,
  isLoadingCreateOauth,
  showError,
}: AuthenticationProps) {
  const { t } = useTranslation('common');
  const { data: dataOauths, mutate: fetchOauths } = api.oauths.list({
    type: 'git',
    redirect_uri: typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : '',
  });

  const { data: dataGitHubOauth, mutate: fetchGitHubOauth } = api.oauths.detail(OauthProviderEnum.GITHUB, {
    redirect_uri: typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : '',
  });
  const oauthGitHub = useMemo(() => dataGitHubOauth?.oauth || {}, [dataGitHubOauth]);

  const accessTokenExists = useMemo(() => branch?.access_token_exists, [branch]);

  const providerMapping = useMemo(() => {
    const mapping = dataOauths?.oauths?.reduce(
      (acc, curr) => {
        acc[curr.provider] = curr;
        return acc;
      },
      {},
    ) || {};
    if (oauthGitHub) {
      mapping[OauthProviderEnum.GITHUB] = oauthGitHub;
    }
    return mapping;
  }, [
    dataOauths,
    oauthGitHub,
  ]);

  const anyOauthAuthenticated = useMemo(
    () => Object.values(providerMapping).some((oauth) => oauth?.['authenticated']),
    [providerMapping],
  );

  return (
    <>
      <Headline>
        {t('version_control.authentication')}
      </Headline>

      <Spacing mt={UNITS_BETWEEN_ITEMS_IN_SECTIONS}>
        {accessTokenExists && !anyOauthAuthenticated && (
          <Spacing mb={2}>
            <Button
              disabled
            >
              {t('version_control.using_access_token')}
            </Button>
            <Spacing mt={1}>
              <Text muted>
                {t('version_control.some_features_may_not_work')}
              </Text>
            </Spacing>
          </Spacing>
        )}

        <Spacing mb={UNITS_BETWEEN_SECTIONS}>
          <Spacing mb={UNITS_BETWEEN_ITEMS_IN_SECTIONS}>
            <Text muted>
              {t('version_control.auth_explanation')}
            </Text>
          </Spacing>
          <Spacing mb={UNITS_BETWEEN_ITEMS_IN_SECTIONS} style={{ maxWidth: '600px' }}>
            <Divider muted />
            {Object.entries(providerMapping || {}).map(([provider, oauth]) => (
              <>
                <Provider
                  isLoadingCreateOauth={isLoadingCreateOauth}
                  key={provider}
                  oauth={oauth}
                  provider={provider}
                  showError={showError}
                />
                <Divider muted />
              </>
            ))}
          </Spacing>
        </Spacing>
      </Spacing>
    </>
  );
}

export default Authentication;
