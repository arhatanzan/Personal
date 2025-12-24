import React, { useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import ColoredDivider from '../components/ColoredDivider';

const Home = ({ siteData }) => {
  const [searchParams] = useSearchParams();
  const pageId = searchParams.get('page');

  const activeData = useMemo(() => {
    if (!siteData) return null;
    if (pageId && siteData.pages && siteData.pages[pageId]) {
      const pageData = siteData.pages[pageId];
      return {
        ...pageData,
        theme: pageData.theme || siteData.theme,
        profile: pageData.profile || siteData.profile,
        footer: (pageData.useGlobalFooter !== false) ? siteData.footer : pageData.footer
      };
    }
    return siteData;
  }, [siteData, pageId]);

  useEffect(() => {
    if (!activeData) return;
    const theme = activeData.theme || {};
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
  }, [activeData]);

  if (!activeData) return null;

  const { profile, sectionOrder, sectionSettings, theme } = activeData;
    // Button color order to match legacy_public divider: Light Blue, Green, Yellow, Red
    const buttonColors = (theme && theme.buttonColors) || [
        '#80d6ff', // Light Blue
        '#3DCD49', // Green
        '#ffd300', // Yellow
        '#ff5852'  // Red
    ];

    // Global button color index for cycling across all sections (useRef to persist across renders)
    const btnColorIndexRef = React.useRef(0);
    const getBtnColor = (customColor) => {
        if (customColor) return customColor;
        const color = buttonColors[btnColorIndexRef.current % buttonColors.length];
        btnColorIndexRef.current++;
        return color;
    };

  // Prepare sections
  let order = sectionOrder || ['profile', 'socialLinks', 'workLinks', 'publications', 'connectLinks', 'footer'];
  
  if (pageId && siteData.pages && siteData.pages[pageId]) {
      // Insert back button logic
      const profileIndex = order.indexOf('profile');
      if (profileIndex !== -1) {
          order = [...order.slice(0, profileIndex + 1), 'backButton', ...order.slice(profileIndex + 1)];
      } else {
          order = ['backButton', ...order];
      }
  }

  return (
    <div className="public-layout">
      <header className="site-header">
        {profile && (
            <>
                <h1 className="brand-name">{profile.name || ''}</h1>
                <p className="subtitle">{profile.subtitle || ''}</p>
            </>
        )}
      </header>

            <div id="site-container">
                {(() => {
                    // Reset color index at the start of each render
                    btnColorIndexRef.current = 0;
                    return order.map((key, index) => {
                        // Divider Logic
                        const settings = (activeData.sectionSettings && activeData.sectionSettings[key]) || {};
                        let showTop = settings.dividerTop;
                        let showBottom = settings.dividerBottom;

                        if (typeof showTop === 'undefined') {
                            showTop = index > 0 && key !== 'footer';
                            if (index > 0 && order[index - 1] === 'profile') showTop = false;
                        }
                        if (typeof showBottom === 'undefined') showBottom = false;

                        // Pass the global getBtnColor to each section
                        const sectionContent = renderSection(key, activeData, getBtnColor);
                        if (!sectionContent) return null;

                        return (
                            <React.Fragment key={key}>
                                {showTop && <ColoredDivider />}
                                {sectionContent}
                                {showBottom && <ColoredDivider />}
                            </React.Fragment>
                        );
                    });
                })()}
            </div>
    </div>
  );
};

const renderSection = (key, data, getBtnColor) => {
    switch(key) {
        case 'profile':
            if (!data.profile || !data.profile.image) return null;
            return (
                <div className="profile-container">
                    <img src={data.profile.image} alt="Profile" className="profile-img" />
                </div>
            );
        case 'socialLinks':
            return <LinkSection title="Social Links" items={data.socialLinks} getBtnColor={getBtnColor} id="social-links-container" />;
        case 'workLinks':
            return <LinkSection title="Work" items={data.workLinks} getBtnColor={getBtnColor} id="work-links-container" />;
        case 'publications':
            return <LinkSection title="Publications" items={data.publications} getBtnColor={getBtnColor} id="publications-container" />;
        case 'connectLinks':
            return <LinkSection items={data.connectLinks} isConnect={true} id="connect-container" />;
        case 'footer':
            return <footer>{data.footer || ''}</footer>;
        case 'backButton':
             return (
                 <div className="links" id="back-btn">
                    <Link to="/" className="link-btn" style={{maxWidth: '250px', '--btn-color': '#6c757d'}}>
                        <i className="fas fa-arrow-left me-2"></i> Back to Home
                    </Link>
                 </div>
             );
        default:
            if (data[key]) {
                return <LinkSection title={data[key].title} items={data[key].links} getBtnColor={getBtnColor} id={`section-${key}`} />;
            }
            return null;
    }
};

const LinkSection = ({ title, items, isConnect = false, getBtnColor, id }) => {
    if (!items || items.length === 0) return null;

    const groups = [];
    let currentGroup = [];

    items.forEach((item) => {
        const hasContent = item.title || item.subtitle || item.description;
        
        if (hasContent) {
            if (currentGroup.length > 0) {
                groups.push({ type: 'links', items: currentGroup });
                currentGroup = [];
            }
            groups.push({ type: 'content', item });
        } else {
            currentGroup.push(item);
        }
    });
    if (currentGroup.length > 0) {
        groups.push({ type: 'links', items: currentGroup });
    }

    return (
        <div id={id}>
            {title && <h2 className="section-title">{title}</h2>}
            {groups.map((group, idx) => {
                if (group.type === 'links') {
                    const wrapperClass = isConnect ? 'social-icons' : 'links';
                    return (
                        <div key={idx} className={wrapperClass}>
                            {group.items.map((item, i) => {
                                if (isConnect) {
                                    return (
                                        <a key={i} href={item.url} target="_blank" rel="noopener noreferrer">
                                            <i className={item.icon}></i>
                                        </a>
                                    );
                                }
                                const btnColor = getBtnColor ? getBtnColor(item.customColor) : null;
                                const btnStyle = btnColor ? { '--btn-color': btnColor } : {};
                                return (
                                    <a key={i} href={item.url} className={`link-btn ${item.customColor ? 'custom-color' : ''}`} style={btnStyle} target="_blank" rel="noopener noreferrer">
                                        {item.text}
                                    </a>
                                );
                            })}
                        </div>
                    );
                } else {
                    // Content item
                    const { item } = group;
                    const { title, subtitle, description, text, url, customColor } = item;
                    const btnColor = getBtnColor ? getBtnColor(customColor) : null;
                    const btnStyle = btnColor ? { '--btn-color': btnColor } : {};
                    
                    return (
                        <div key={idx}>
                             <p className="text-content">
                                {title && <strong>{title}</strong>}
                                {title && subtitle && ' | '}
                                {subtitle && <span className="hindi-text">{subtitle}</span>}
                                {(title || subtitle) && <br />}
                                {description}
                            </p>
                            {text && url && (
                                <div className="links">
                                    <a href={url} className={`link-btn ${customColor ? 'custom-color' : ''}`} style={btnStyle} target="_blank" rel="noopener noreferrer">
                                        {text}
                                    </a>
                                </div>
                            )}
                        </div>
                    );
                }
            })}
        </div>
    );
};

export default Home;
