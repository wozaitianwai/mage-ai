import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import dark from '@oracle/styles/themes/dark';

const SwitcherContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LanguageButton = styled.button<{ $active?: boolean }>`
  background: ${({ $active, theme }) => ($active ? (theme.interactive || dark.interactive).linkPrimary : 'transparent')};
  border: 1px solid ${({ $active, theme }) => ($active ? (theme.interactive || dark.interactive).linkPrimary : (theme.borders || dark.borders).medium)};
  border-radius: 4px;
  color: ${({ $active, theme }) => ($active ? (theme.monotone || dark.monotone).white : (theme.content || dark.content).active)};
  cursor: pointer;
  font-size: 12px;
  padding: 4px 8px;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ $active, theme }) => ($active ? (theme.interactive || dark.interactive).linkPrimaryHover : (theme.interactive || dark.interactive).hoverBackground)};
    border-color: ${({ theme }) => (theme.interactive || dark.interactive).linkPrimary};
    color: ${({ $active, theme }) => ($active ? (theme.monotone || dark.monotone).white : (theme.content || dark.content).active)};
  }
`;


interface LanguageSwitcherProps {
  className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className }) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  const changeLanguage = (newLocale: string) => {
    i18n.changeLanguage(newLocale);
  };

  return (
    <SwitcherContainer className={className}>
      <LanguageButton
        $active={currentLang === 'zh' || currentLang?.startsWith('zh')}
        onClick={() => changeLanguage('zh')}
        title="切换到中文"
      >
        中文
      </LanguageButton>
      <LanguageButton
        $active={currentLang === 'en' || currentLang?.startsWith('en')}
        onClick={() => changeLanguage('en')}
        title="Switch to English"
      >
        EN
      </LanguageButton>
    </SwitcherContainer>
  );
};

export default LanguageSwitcher;
