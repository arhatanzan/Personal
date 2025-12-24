import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { siteData } from '../data'
import './styles/user.css'
import Header from './components/Header'
import Profile from './components/Profile'
import LinkSection from './components/LinkSection'
import ColoredDivider from './components/ColoredDivider'
import Footer from './components/Footer'

function PublicProfile() {
  console.log('PublicProfile rendering, siteData:', siteData);
  const [searchParams] = useSearchParams();
  const pageId = searchParams.get('page');
  
  const [activeData, setActiveData] = useState(siteData || {});
  const [isSubPage, setIsSubPage] = useState(false);

  useEffect(() => {
    if (pageId && siteData && siteData.pages && siteData.pages[pageId]) {
        const pageData = siteData.pages[pageId];
        setActiveData({
            ...pageData,
            theme: pageData.theme || siteData.theme,
            profile: pageData.profile || siteData.profile,
            footer: (pageData.useGlobalFooter !== false) ? siteData.footer : pageData.footer,
            sectionOrder: pageData.sectionOrder || siteData.sectionOrder
        });
        setIsSubPage(true);
    } else {
        setActiveData(siteData || {});
        setIsSubPage(false);
    }
  }, [pageId]);

  const theme = activeData?.theme || {};
  
  // Apply theme variables
  useEffect(() => {
    const root = document.documentElement;
    const props = {
        '--bg-color': theme.backgroundColor,
        '--bg-image': theme.backgroundImage ? `url('${theme.backgroundImage}')` : null,
        '--text-color': theme.textColor,
        '--font-family': theme.fontFamily,
        '--font-size-base': theme.fontSize ? theme.fontSize + 'px' : null,
        '--section-spacing': theme.sectionSpacing ? theme.sectionSpacing + 'px' : null,
        '--text-spacing': theme.textSpacing ? theme.textSpacing + 'px' : null,
        '--btn-spacing': theme.btnSpacing ? theme.btnSpacing + 'px' : null,
        '--header-bg': theme.backgroundColor
    };

    for (const [key, value] of Object.entries(props)) {
        if (value) root.style.setProperty(key, value);
    }
    
    // Custom Font
    if (theme.customFontUrl) {
        let link = document.getElementById('custom-font-link');
        if (!link) {
            link = document.createElement('link');
            link.id = 'custom-font-link';
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }
        link.href = theme.customFontUrl;
    }
  }, [theme]);

  // Apply button colors globally to match legacy behavior
  useEffect(() => {
      const buttons = document.querySelectorAll('.link-btn');
      const colors = theme.buttonColors || ['#80d6ff', '#3DCD49', '#ffd300', '#ff5852'];
      
      let colorIndex = 0;
      buttons.forEach((btn) => {
          if (btn.classList.contains('custom-color')) return;
          
          const color = colors[colorIndex % colors.length];
          btn.style.setProperty('--btn-color', color);
          colorIndex++;
      });
  }, [activeData, theme]);

  if (!activeData) return null;

  let order = activeData.sectionOrder || ['profile', 'socialLinks', 'workLinks', 'publications', 'connectLinks', 'footer'];
  
  // Handle Back Button for subpages
  if (isSubPage) {
      const profileIndex = order.indexOf('profile');
      if (profileIndex !== -1) {
          order = [...order.slice(0, profileIndex + 1), 'backButton', ...order.slice(profileIndex + 1)];
      } else {
          order = ['backButton', ...order];
      }
  }

  const renderSection = (key, index) => {
      // Divider Logic
      const settings = (activeData.sectionSettings && activeData.sectionSettings[key]) || {};
      let showTop = settings.dividerTop;
      let showBottom = settings.dividerBottom;

      if (typeof showTop === 'undefined') {
          showTop = index > 0 && key !== 'footer';
          if (index > 0 && order[index - 1] === 'profile') showTop = false;
      }
      if (typeof showBottom === 'undefined') showBottom = false;

      let content = null;
      
      switch(key) {
          case 'profile':
              content = <Profile profile={activeData.profile} />;
              break;
          case 'socialLinks':
              content = <LinkSection title="Social Links" items={activeData.socialLinks} theme={theme} id="social-links-container" />;
              break;
          case 'workLinks':
              content = <LinkSection title="Work" items={activeData.workLinks} theme={theme} id="work-links-container" />;
              break;
          case 'publications':
              content = <LinkSection title="Publications" items={activeData.publications} theme={theme} id="publications-container" />;
              break;
          case 'footer':
              content = (
                  <>
                    <LinkSection items={activeData.connectLinks} isConnect={true} theme={theme} id="connect-container" />
                    <Footer text={activeData.footer} />
                  </>
              );
              break;
          case 'connectLinks':
              // Merged into footer
              content = null;
              break;
          case 'backButton':
              content = (
                 <div className="links" id="back-btn">
                    <Link to="/" className="link-btn" style={{maxWidth: '250px', '--btn-color': '#6c757d'}}>
                        <i className="fas fa-arrow-left me-2"></i> Back to Home
                    </Link>
                 </div>
              );
              break;
          default:
              if (activeData[key]) {
                  content = <LinkSection title={activeData[key].title} items={activeData[key].links} theme={theme} id={`section-${key}`} />;
              }
              break;
      }

      if (!content) return null;

      return (
          <React.Fragment key={key}>
              {showTop && <ColoredDivider />}
              {content}
              {showBottom && <ColoredDivider />}
          </React.Fragment>
      );
  };

  return (
    <>
      <Header profile={activeData.profile} />
      <div id="site-container">
          {order.map((key, index) => renderSection(key, index))}
      </div>
    </>
  )
}

export default PublicProfile
