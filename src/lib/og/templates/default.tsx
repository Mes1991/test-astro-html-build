import { siteSeo } from '../../seo/defaults';
import { OG_PALETTE, type DefaultTemplateData } from './types';

const siteHost = new URL(siteSeo.siteUrl).host;

export function DefaultOgCard({ title, kicker, locale }: Omit<DefaultTemplateData, 'template'> & { locale?: string }) {
  const tagline = locale === 'es' ? siteSeo.taglineEs : siteSeo.tagline;
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '64px 80px',
        background: `linear-gradient(135deg, ${OG_PALETTE.inkDeep} 0%, ${OG_PALETTE.ink} 60%, ${OG_PALETTE.inkMid} 100%)`,
        color: OG_PALETTE.paper,
        fontFamily: 'JetBrains Mono',
      }}
    >
      {/* Top row: brand + kicker */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div
          style={{
            display: 'flex',
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: OG_PALETTE.accent,
          }}
        >
          {siteSeo.brand}
        </div>
        {kicker && (
          <div
            style={{
              display: 'flex',
              fontSize: 18,
              fontWeight: 400,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              opacity: 0.7,
            }}
          >
            {kicker}
          </div>
        )}
      </div>

      {/* Title */}
      <div
        style={{
          display: 'flex',
          fontSize: 88,
          fontWeight: 700,
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
          maxWidth: 1040,
        }}
      >
        {title}
      </div>

      {/* Bottom rule */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 24,
          borderTop: `2px solid ${OG_PALETTE.accent}`,
        }}
      >
        <div style={{ display: 'flex', fontSize: 20, opacity: 0.85 }}>{siteHost}</div>
        <div style={{ display: 'flex', fontSize: 20, color: OG_PALETTE.accent }}>
          {tagline}
        </div>
      </div>
    </div>
  );
}
