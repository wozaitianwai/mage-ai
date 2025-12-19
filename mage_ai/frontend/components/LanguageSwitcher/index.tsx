import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

const SwitcherContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LanguageButton = styled.button<{ $active?: boolean }>`
  background: ${({ $active }) => ($active ? 'var(--primary-color, #6B50D8)' : 'transparent')};
  border: 1px solid ${({ $active }) => ($active ? 'var(--primary-color, #6B50D8)' : 'var(--border-color, #3a3a3a)')};
  border-radius: 4px;
  color: ${({ $active }) => ($active ? '#fff' : 'var(--text-color, #fff)')};
  cursor: pointer;
  font-size: 12px;
  padding: 4px 8px;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ $active }) => ($active ? 'var(--primary-color, #6B50D8)' : 'rgba(107, 80, 216, 0.2)')};
    border-color: var(--primary-color, #6B50D8);
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
