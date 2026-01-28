import React from 'react';

// Responsive Template Styles
const TemplateResponsiveStyles = () => (
  <style>{`
    /* Base Template Container Responsive Styles */
    .cover-letter-content,
    .professional-profile-layout,
    .portrait-template-card {
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
      overflow-x: hidden;
    }
    
    /* Force word wrapping on all text elements */
    .cover-letter-content *,
    .professional-profile-layout *,
    .portrait-template-card * {
      word-wrap: break-word !important;
      overflow-wrap: break-word !important;
      word-break: break-word !important;
      max-width: 100%;
    }

    /* ============ COVER LETTER RESPONSIVE ============ */
    .cover-letter-content {
      padding: 20px;
      width: 100%;
      max-width: 100%;
      overflow-x: hidden;
      box-sizing: border-box;
    }
    
    .cover-letter-content * {
      word-wrap: break-word !important;
      overflow-wrap: break-word !important;
      max-width: 100%;
    }
    
    .cover-letter-header-banner {
      flex-wrap: wrap;
      gap: 16px;
      max-width: 100%;
    }
    
    @media (max-width: 768px) {
      .cover-letter-content {
        padding: 12px !important;
      }
      
      .cover-letter-header-banner {
        flex-direction: column !important;
        text-align: center !important;
        padding: 16px 12px !important;
        border-radius: 20px !important;
        margin-bottom: 20px !important;
      }
      
      .cover-letter-header-name {
        font-size: 1.2rem !important;
        text-align: center !important;
        margin-bottom: 10px;
      }
      
      .cover-letter-header-name div {
        display: inline !important;
      }
      
      .cover-letter-header-name div:not(:last-child)::after {
        content: ' ';
      }
      
      .cover-letter-header-contact {
        text-align: center !important;
        font-size: 0.75rem !important;
        word-break: break-all !important;
        overflow-wrap: break-word !important;
      }
      
      .cover-letter-company {
        font-size: 0.85rem !important;
        word-break: break-word !important;
      }
      
      .cover-letter-salutation {
        font-size: 0.9rem !important;
      }
      
      .cover-letter-body {
        margin-bottom: 16px !important;
      }
      
      .cover-letter-body p {
        font-size: 0.85rem !important;
        line-height: 1.6 !important;
        text-align: left !important;
        margin-bottom: 10px !important;
        word-break: break-word !important;
      }
      
      .cover-letter-closing {
        font-size: 0.85rem !important;
        margin-top: 16px !important;
      }
      
      .cover-letter-signature {
        margin-top: 20px !important;
        font-size: 0.85rem !important;
      }
      
      .cover-letter-date {
        margin-top: 16px !important;
        font-size: 0.85rem !important;
      }
    }
    
    @media (max-width: 480px) {
      .cover-letter-content {
        padding: 10px !important;
      }
      
      .cover-letter-header-banner {
        padding: 14px 10px !important;
        border-radius: 16px !important;
        margin-bottom: 16px !important;
      }
      
      .cover-letter-header-name {
        font-size: 1.1rem !important;
      }
      
      .cover-letter-header-contact {
        font-size: 0.7rem !important;
      }
      
      .cover-letter-body p {
        font-size: 0.8rem !important;
        line-height: 1.5 !important;
      }
      
      .cover-letter-company,
      .cover-letter-salutation,
      .cover-letter-closing,
      .cover-letter-signature {
        font-size: 0.8rem !important;
      }
    }
    
    @media (max-width: 360px) {
      .cover-letter-content {
        padding: 8px !important;
      }
      
      .cover-letter-header-banner {
        padding: 12px 8px !important;
      }
      
      .cover-letter-header-name {
        font-size: 1rem !important;
      }
      
      .cover-letter-body p {
        font-size: 0.75rem !important;
      }
    }

    /* ============ PROFESSIONAL PROFILE RESPONSIVE ============ */
    .professional-profile-layout {
      display: flex;
      gap: 24px;
      padding: 20px;
      width: 100%;
      max-width: 100%;
      overflow-x: hidden;
      box-sizing: border-box;
    }
    
    .professional-profile-layout.simple {
      flex-direction: row;
    }
    
    .professional-profile-content {
      flex: 1;
      min-width: 0;
      overflow-x: hidden;
    }
    
    .professional-profile-summary {
      line-height: 1.8;
      word-wrap: break-word !important;
      overflow-wrap: break-word !important;
      word-break: break-word !important;
      max-width: 100%;
    }
    
    .professional-profile-summary * {
      word-wrap: break-word !important;
      overflow-wrap: break-word !important;
      word-break: break-word !important;
      max-width: 100%;
    }
    
    .professional-profile-sidebar {
      flex-shrink: 0;
    }
    
    .professional-profile-sidebar.simple {
      width: 180px;
      text-align: center;
    }
    
    .professional-profile-image {
      width: 100%;
      max-width: 180px;
      height: auto;
      border-radius: 12px;
      object-fit: cover;
    }
    
    .professional-profile-name {
      margin-top: 12px;
      font-weight: 600;
      font-size: 1rem;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    @media (max-width: 768px) {
      .professional-profile-layout {
        flex-direction: column-reverse !important;
        gap: 16px !important;
        padding: 12px !important;
      }
      
      .professional-profile-layout.simple {
        flex-direction: column-reverse !important;
      }
      
      .professional-profile-sidebar.simple {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      
      .professional-profile-image {
        max-width: 120px !important;
        border-radius: 50%;
      }
      
      .professional-profile-name {
        font-size: 1rem !important;
        margin-top: 8px !important;
      }
      
      .professional-profile-summary {
        font-size: 0.85rem !important;
        line-height: 1.6 !important;
      }
      
      .professional-profile-summary * {
        font-size: inherit !important;
        line-height: inherit !important;
      }
    }
    
    @media (max-width: 480px) {
      .professional-profile-layout {
        padding: 10px !important;
        gap: 14px !important;
      }
      
      .professional-profile-image {
        max-width: 100px !important;
      }
      
      .professional-profile-summary {
        font-size: 0.8rem !important;
        line-height: 1.5 !important;
      }
      
      .professional-profile-name {
        font-size: 0.95rem !important;
      }
    }
    
    @media (max-width: 360px) {
      .professional-profile-layout {
        padding: 8px !important;
        gap: 12px !important;
      }
      
      .professional-profile-summary {
        font-size: 0.75rem !important;
      }
      
      .professional-profile-image {
        max-width: 90px !important;
      }
    }

    /* ============ DESIGNER PORTRAIT RESPONSIVE ============ */
    .portrait-template-card {
      display: flex;
      gap: 24px;
      padding: 24px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: 16px;
      width: 100%;
      max-width: 100%;
      overflow-x: hidden;
      box-sizing: border-box;
    }
    
    .portrait-left-panel {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 20px;
      overflow-x: hidden;
    }
    
    .portrait-right-panel {
      width: 280px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 0;
    }
    
    .portrait-tagline {
      font-size: 0.85rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .portrait-name-stack {
      font-size: 2.5rem;
      font-weight: 700;
      line-height: 1.1;
      color: #111827;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .portrait-name-stack div {
      display: block;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .portrait-summary-block {
      line-height: 1.7;
      color: #374151;
      word-wrap: break-word;
      overflow-wrap: break-word;
      max-width: 100%;
    }
    
    .portrait-summary-block p {
      margin-bottom: 12px;
      word-wrap: break-word;
      overflow-wrap: break-word;
      max-width: 100%;
    }
    
    .portrait-section,
    .portrait-contact-panel,
    .portrait-right-section {
      word-wrap: break-word;
      overflow-wrap: break-word;
      max-width: 100%;
    }
    
    .portrait-section h4,
    .portrait-contact-panel h4,
    .portrait-right-section h4 {
      font-size: 0.9rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .portrait-section p,
    .portrait-right-section p {
      font-size: 0.9rem;
      line-height: 1.6;
      color: #4b5563;
      word-wrap: break-word;
      overflow-wrap: break-word;
      max-width: 100%;
    }
    
    .portrait-contact-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .portrait-contact-list div {
      font-size: 0.85rem;
      color: #374151;
      word-wrap: break-word;
      overflow-wrap: break-word;
      word-break: break-all;
    }
    
    .portrait-contact-list span {
      font-weight: 500;
      color: #6b7280;
      margin-right: 8px;
    }
    
    .portrait-photo-wrap {
      width: 100%;
      aspect-ratio: 3/4;
      overflow: hidden;
      border-radius: 12px;
      background: #e5e7eb;
    }
    
    .portrait-photo-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    @media (max-width: 900px) {
      .portrait-template-card {
        flex-direction: column;
        gap: 20px;
        padding: 20px;
      }
      
      .portrait-right-panel {
        width: 100%;
        order: -1;
      }
      
      .portrait-photo-wrap {
        max-width: 280px;
        margin: 0 auto;
      }
      
      .portrait-name-stack {
        font-size: 2rem;
        text-align: center;
      }
      
      .portrait-tagline {
        text-align: center;
      }
    }
    
    @media (max-width: 768px) {
      .portrait-template-card {
        padding: 12px !important;
        gap: 14px !important;
        border-radius: 12px !important;
      }
      
      .portrait-left-panel {
        gap: 14px !important;
      }
      
      .portrait-name-stack {
        font-size: 1.5rem !important;
        line-height: 1.2 !important;
        margin-bottom: 8px;
      }
      
      .portrait-name-stack div {
        word-break: break-word !important;
      }
      
      .portrait-tagline {
        font-size: 0.7rem !important;
        letter-spacing: 0.5px !important;
      }
      
      .portrait-summary-block {
        font-size: 0.85rem !important;
        line-height: 1.5 !important;
      }
      
      .portrait-summary-block p {
        font-size: 0.85rem !important;
        margin-bottom: 10px !important;
      }
      
      .portrait-photo-wrap {
        max-width: 200px;
        border-radius: 10px;
      }
      
      .portrait-section h4,
      .portrait-contact-panel h4,
      .portrait-right-section h4 {
        font-size: 0.75rem !important;
        margin-bottom: 6px !important;
      }
      
      .portrait-section p,
      .portrait-right-section p {
        font-size: 0.8rem !important;
        line-height: 1.5 !important;
      }
      
      .portrait-contact-list div {
        font-size: 0.75rem !important;
        word-break: break-all !important;
      }
    }
    
    @media (max-width: 480px) {
      .portrait-template-card {
        padding: 10px !important;
        gap: 12px !important;
      }
      
      .portrait-left-panel {
        gap: 12px !important;
      }
      
      .portrait-name-stack {
        font-size: 1.3rem !important;
        line-height: 1.2 !important;
      }
      
      .portrait-tagline {
        font-size: 0.65rem !important;
        margin-bottom: 4px !important;
        letter-spacing: 0.3px !important;
      }
      
      .portrait-summary-block {
        font-size: 0.8rem !important;
        line-height: 1.5 !important;
      }
      
      .portrait-photo-wrap {
        max-width: 160px;
        border-radius: 8px;
      }
      
      .portrait-section p,
      .portrait-right-section p,
      .portrait-summary-block p {
        font-size: 0.75rem !important;
        line-height: 1.5 !important;
        margin-bottom: 8px !important;
      }
      
      .portrait-section h4,
      .portrait-contact-panel h4,
      .portrait-right-section h4 {
        font-size: 0.7rem !important;
        margin-bottom: 5px !important;
      }
      
      .portrait-contact-list div,
      .portrait-contact-list span {
        font-size: 0.7rem !important;
      }
    }
    
    /* Extra small screens - very aggressive */
    @media (max-width: 360px) {
      .portrait-template-card {
        padding: 8px !important;
        gap: 10px !important;
      }
      
      .portrait-name-stack {
        font-size: 1.1rem !important;
      }
      
      .portrait-tagline {
        font-size: 0.6rem !important;
      }
      
      .portrait-summary-block,
      .portrait-summary-block p {
        font-size: 0.7rem !important;
      }
      
      .portrait-section p,
      .portrait-right-section p {
        font-size: 0.7rem !important;
      }
      
      .portrait-contact-list div {
        font-size: 0.65rem !important;
      }
    }

    /* ============ GENERIC FALLBACK TEMPLATE RESPONSIVE ============ */
    .profile-card {
      padding: 20px;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .profile-card p {
      line-height: 1.7;
    }
    
    @media (max-width: 768px) {
      .profile-card {
        padding: 16px;
      }
      
      .profile-card p {
        font-size: 0.9rem;
        line-height: 1.6;
      }
      
      .profile-card h3 {
        font-size: 1.2rem;
      }
    }
    
    @media (max-width: 480px) {
      .profile-card {
        padding: 12px;
      }
      
      .profile-card p {
        font-size: 0.85rem;
      }
      
      .profile-card h3 {
        font-size: 1.1rem;
      }
    }
  `}</style>
);

// Cover Letter Display Component
export const CoverLetterDisplay = ({ templateText, profile, templateIcon, templateName, templateDescription }) => {
  const senderName = profile?.name || '';
  const senderEmail = profile?.email || '';
  const senderPhone = profile?.phone || '';
  const senderLinkedin = profile?.linkedin || '';

  const formatPhone = (phone) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phone;
  };

  const formatDate = (date) => {
    const day = date.getDate();
    const month = date.toLocaleDateString('en-GB', { month: 'long' });
    const year = date.getFullYear();
    const getOrdinalSuffix = (n) => {
      if (n > 3 && n < 21) return 'th';
      switch (n % 10) {
        case 1:
          return 'st';
        case 2:
          return 'nd';
        case 3:
          return 'rd';
        default:
          return 'th';
      }
    };

    return `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
  };

  const currentDate = formatDate(new Date());

  const lines = templateText.split('\n').map((line) => line.trim()).filter((line) => line !== '');
  let companyInfo = '';
  let companyAddress = '';
  let salutation = '';
  let bodyStartIndex = 0;
  let closingIndex = -1;
  let signatureStartIndex = -1;

  if (lines.length > 0) {
    companyInfo = lines[0];
  }
  if (lines.length > 1 && !lines[1].toLowerCase().startsWith('dear')) {
    companyAddress = lines[1];
  }

  const salutationIdx = lines.findIndex((line) => line.toLowerCase().startsWith('dear'));
  if (salutationIdx !== -1) {
    salutation = lines[salutationIdx];
    bodyStartIndex = salutationIdx + 1;
  } else {
    bodyStartIndex = companyAddress ? 2 : 1;
  }

  closingIndex = lines.findIndex((line, idx) =>
    idx >= bodyStartIndex &&
    (
      line.toLowerCase().includes('regards') ||
      line.toLowerCase().includes('sincerely') ||
      (line.toLowerCase().includes('best') && line.toLowerCase().includes('regards'))
    )
  );

  if (closingIndex !== -1) {
    signatureStartIndex = closingIndex + 1;
  }

  const bodyEnd = closingIndex !== -1 ? closingIndex : lines.length;
  const bodyLines = lines.slice(bodyStartIndex, bodyEnd);
  const closing = closingIndex !== -1 ? lines[closingIndex] : '';
  const signatureLines = signatureStartIndex !== -1 ? lines.slice(signatureStartIndex) : [];

  return (
    <div className="cover-letter-content">
      <TemplateResponsiveStyles />
      <div
        className="cover-letter-header-banner"
        style={{
          background: '#1e3a5f',
          borderRadius: '50px',
          padding: '30px 40px',
          marginBottom: '40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: 'white',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div
          className="cover-letter-header-name"
          style={{
            fontSize: '1.8rem',
            fontWeight: 'bold',
            lineHeight: '1.2',
            color: 'white',
          }}
        >
          {senderName.split(' ').map((part, index) => (
            <div key={index} style={{ lineHeight: '1.2' }}>
              {part}
            </div>
          ))}
        </div>
        <div
          className="cover-letter-header-contact"
          style={{
            textAlign: 'right',
            fontSize: '0.9rem',
            lineHeight: '1.6',
            color: 'white',
          }}
        >
          {(senderEmail || senderPhone) && (
            <div style={{ marginBottom: '4px' }}>
              {senderEmail && <span>{senderEmail}</span>}
              {senderEmail && senderPhone && <span> | </span>}
              {senderPhone && <span>{formatPhone(senderPhone)}</span>}
            </div>
          )}
          {senderLinkedin && <div>{senderLinkedin}</div>}
        </div>
      </div>

      {(companyInfo || companyAddress) && (
        <div className="cover-letter-company" style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '8px' }}>To the hiring Manager</div>
          {companyInfo && <div>{companyInfo}</div>}
          {companyAddress && <div>{companyAddress}</div>}
          <div className="cover-letter-date" style={{ marginTop: '20px' }}>
            <strong>{currentDate}</strong>
          </div>
        </div>
      )}

      {salutation && (
        <div className="cover-letter-salutation" style={{ marginBottom: '20px' }}>
          {salutation}
        </div>
      )}

      <div className="cover-letter-body" style={{ marginBottom: '20px' }}>
        {bodyLines.map(
          (paragraph, index) =>
            paragraph && (
              <p 
                key={index} 
                style={{ marginBottom: '16px', lineHeight: '1.8', textAlign: 'justify' }}
                dangerouslySetInnerHTML={{ __html: paragraph }}
              />
            )
        )}
      </div>

      {closing && (
        <div className="cover-letter-closing" style={{ marginTop: '30px', marginBottom: '10px' }}>
          {closing}
        </div>
      )}

      {signatureLines.length > 0 && (
        <div className="cover-letter-signature" style={{ marginTop: '40px' }}>
          {signatureLines.map((line, index) => (
            line && (
              <div key={index} style={{ fontStyle: index === 0 ? 'normal' : 'italic', fontFamily: index === 0 ? 'inherit' : 'cursive' }}>
                {line}
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
};

// Professional Profile Display Component
export const ProfessionalProfileDisplay = ({ templateText, profile }) => {
  const profileImage = profile?.profileImage || '';
  const profileName = profile?.name || '';
  const summary = templateText || '';

  return (
    <div className="professional-profile-layout simple">
      <TemplateResponsiveStyles />
      <div className="professional-profile-content">
        <div 
          className="professional-profile-summary"
          dangerouslySetInnerHTML={{ __html: summary }}
        />
      </div>

      {profileImage && (
        <div className="professional-profile-sidebar simple">
          <img
            src={profileImage}
            alt={profileName || 'Profile'}
            className="professional-profile-image"
          />
          {profileName && (
            <div className="professional-profile-name">{profileName}</div>
          )}
        </div>
      )}
    </div>
  );
};

export const DesignerPortraitDisplay = ({ templateText, profile }) => {
  const nameParts = profile?.name ? profile.name.split(' ').filter(Boolean) : ['Your', 'Name'];
  const summaryParagraphs = templateText
    ? templateText.split('\n').map((line) => line.trim()).filter((line) => line.length > 0)
    : [];
  const degreeLine = profile?.currentDegree
    ? `${profile.currentDegree}${profile?.branch ? ` · ${profile.branch}` : ''}`
    : profile?.branch || 'Creative Professional';
  const location = profile?.institute || profile?.city || '';
  const phone = profile?.phone || '';
  const email = profile?.email || '';
  const linkedin = profile?.linkedin || '';
  const achievements = profile?.achievements || '';
  const skills = profile?.technicalSkills || '';
  const certifications = profile?.certifications || '';
  const summaryFallback = 'I craft thoughtful visual stories through research-led design and collaborative experimentation.';
  const contactItems = [
    phone && { label: 'Phone', value: phone },
    email && { label: 'Email', value: email },
    linkedin && { label: 'LinkedIn', value: linkedin },
    location && { label: 'Location', value: location },
  ].filter(Boolean);
  const portfolioTextParts = [];
  if (achievements) {
    portfolioTextParts.push(`Recent highlights: ${achievements}`);
  }
  if (skills) {
    portfolioTextParts.push(`Focus areas: ${skills}`);
  }
  const portfolioText = portfolioTextParts.join('. ');
  const followText = linkedin
    ? `Catch behind-the-scenes snapshots and live project notes on LinkedIn (${linkedin}).`
    : 'Connect with me for in-progress looks at my design process and experiments.';
  const photo = profile?.profileImage?.trim()
    ? profile.profileImage
    : 'https://via.placeholder.com/420x520.png?text=Profile';

  return (
    <div className="portrait-template-card">
      <TemplateResponsiveStyles />
      <div className="portrait-left-panel">
        <div>
          <div className="portrait-tagline">{degreeLine}</div>
          <div className="portrait-name-stack">
            {nameParts.map((part, index) => (
              <div key={index}>{part}</div>
            ))}
          </div>
        </div>

        <div className="portrait-summary-block">
          {summaryParagraphs.length > 0
            ? summaryParagraphs.map((paragraph, index) => (
                <p key={index} dangerouslySetInnerHTML={{ __html: paragraph }} />
              ))
            : <p>{summaryFallback}</p>}
        </div>

        <div className="portrait-section">
          <h4>About Me</h4>
          <p>
            {profile?.yearOfStudy && (
              <span>Currently in year {profile.yearOfStudy}. </span>
            )}
            {certifications && (
              <span>Certified in {certifications}. </span>
            )}
            Always exploring new mediums to bridge strategy and craft.
          </p>
        </div>

        <div className="portrait-contact-panel">
          <h4>Contact</h4>
          <div className="portrait-contact-list">
            {contactItems.map((item, index) => (
              <div key={`${item.label}-${index}`}>
                <span>{item.label}</span>
                {item.value}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="portrait-right-panel">
        <div className="portrait-photo-wrap">
          <img src={photo} alt={profile?.name || 'Profile portrait'} />
        </div>
        <div className="portrait-right-section">
          <h4>Portfolio</h4>
          <p>
            {portfolioText || 'Explore my latest identity systems, editorial layouts, and digital experiences where clean typography meets bold storytelling.'}
          </p>
        </div>
        <div className="portrait-right-section">
          <h4>Follow My Work</h4>
          <p>{followText}</p>
        </div>
      </div>
    </div>
  );
};


