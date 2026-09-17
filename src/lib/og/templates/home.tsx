import { siteSeo } from '../../seo/defaults';
import { OG_PALETTE, type HomeTemplateData } from './types';

const siteHost = new URL(siteSeo.siteUrl).host;

/**
 * Home OG card — a 1200×630 echo of the hero: dark radial backdrop, eyebrow,
 * centered stacked headline with the last line in the accent color, CTA pill.
 * Ported from an internal OG-card factory and neutralized (no mascot; the
 * statement typography carries the card, same as the real hero).
 */
export function HomeOgCard({
  lines,
  eyebrow,
  cta,
  locale,
}: Omit<HomeTemplateData, 'template'>) {
  const tagline = locale === 'es' ? siteSeo.taglineEs : siteSeo.tagline;
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '56px 72px',
        background: `radial-gradient(ellipse at 50% 120%, ${OG_PALETTE.inkMid} 0%, ${OG_PALETTE.ink} 45%, ${OG_PALETTE.inkDeep} 100%)`,
        color: OG_PALETTE.paper,
        fontFamily: 'JetBrains Mono',
        overflow: 'hidden',
      }}
    >
      {/* Ambient accent glow in the corner */}
      <div
        style={{
          position: 'absolute',
          top: -140,
          right: -100,
          width: 420,
          height: 420,
          borderRadius: 999,
          background: `radial-gradient(circle at 50% 50%, ${OG_PALETTE.accent}33 0%, transparent 70%)`,
          display: 'flex',
        }}
      />

      {/* Header: brand left, host right */}
      <div
        style={{
          display: 'flex',
          width: '100%',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
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
        <div
          style={{
            display: 'flex',
            fontSize: 16,
            fontWeight: 400,
            letterSpacing: '0.12em',
            opacity: 0.6,
          }}
        >
          {siteHost}
        </div>
      </div>

      {/* Body: eyebrow + stacked statement headline (centered, like the hero) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28,
        }}
      >
        {eyebrow && (
          <div
            style={{
              display: 'flex',
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: OG_PALETTE.accent,
            }}
          >
            {eyebrow}
          </div>
        )}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontWeight: 700,
            textTransform: 'uppercase',
            lineHeight: 1.02,
            letterSpacing: '-0.02em',
          }}
        >
          {lines.map((line, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                fontSize: 88,
                color: i === lines.length - 1 ? OG_PALETTE.accent : OG_PALETTE.paper,
              }}
            >
              {line}
            </div>
          ))}
        </div>
      </div>

      {/* Footer: CTA pill + tagline */}
      <div
        style={{
          display: 'flex',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {cta ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 26px',
              borderRadius: 999,
              background: OG_PALETTE.accent,
              color: OG_PALETTE.paper,
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: '-0.01em',
            }}
          >
            {cta}
            <span style={{ display: 'flex' }}>→</span>
          </div>
        ) : (
          <span />
        )}
        <div
          style={{
            display: 'flex',
            fontSize: 18,
            color: OG_PALETTE.accent,
            opacity: 0.9,
          }}
        >
          {tagline}
        </div>
      </div>
    </div>
  );
}
