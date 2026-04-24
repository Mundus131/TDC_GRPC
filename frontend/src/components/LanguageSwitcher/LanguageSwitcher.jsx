import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  PL as PlFlag,
  US as UsFlag,
  DE as DeFlag
} from 'country-flag-icons/react/3x2';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  const languages = [
    { 
      code: 'pl',
      Flag: PlFlag,
      label: t('languages.pl'),
      color: '#DC143C'
    },
    { 
      code: 'en',
      Flag: UsFlag,
      label: t('languages.en'),
      color: '#3C3B6E'
    },
    { 
      code: 'de',
      Flag: DeFlag,
      label: t('languages.de'),
      color: '#FFCC00'
    }
  ];

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setCurrentLanguage(lng);
    setIsExpanded(false);
  };

  useEffect(() => {
    setCurrentLanguage(i18n.language);
  }, [i18n.language]);

  const currentLangData = languages.find(lang => lang.code === currentLanguage) || languages[0];
  const otherLanguages = languages.filter(lang => lang.code !== currentLanguage);

  return (
    <div 
      className={`language-switcher ${isExpanded ? 'expanded' : ''}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Current language flag and label (always visible) */}
      <div className="language-switcher__current-container">
        <button 
          className="language-switcher__current"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={currentLangData.label}
        >
          <currentLangData.Flag className="language-switcher__flag-icon" />
          <span className="language-switcher__current-label">{currentLangData.label}</span>
        </button>
      </div>

      {/* Other languages (visible when expanded) */}
      <div className="language-switcher__other-flags">
        {otherLanguages.map(({ code, Flag, label, color }) => (
          <button
            key={code}
            onClick={() => changeLanguage(code)}
            className="language-switcher__flag"
            style={{ '--flag-color': color }}
            aria-label={label}
            title={label}
          >
            <Flag className="language-switcher__flag-icon" />
            <span className="language-switcher__label">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSwitcher;