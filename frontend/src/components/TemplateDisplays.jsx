import React from 'react';

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


