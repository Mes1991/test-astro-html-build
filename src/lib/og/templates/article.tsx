import { siteSeo } from '../../seo/defaults';
import { OG_PALETTE, type ArticleTemplateData } from './types';

const siteHost = new URL(siteSeo.siteUrl).host;

/**
 * Article OG card — light "paper" card with a category chip, statement title,
 * rotating CTA pill (see assets.ts), and a hairline footer carrying author,
 * read time, and the site host. Structure ported from an internal OG-card
 * factory, neutralized (no mascot panel — the title takes the full width).
 */
export function ArticleOgCard({
  title,
  category,
  author,
  readTime,
  cta,
}: Omit<ArticleTemplateData, 'template'>) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '56px 72px',
        background: OG_PALETTE.paper,
        color: OG_PALETTE.ink,
        fontFamily: 'JetBrains Mono',
      }}
    >
      {/* Header band: category chip + brand kicker */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            padding: '10px 18px',
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            background: OG_PALETTE.accent,
            color: OG_PALETTE.paper,
            borderRadius: 6,
          }}
        >
          {category ?? 'Notes'}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 16,
            fontWeight: 400,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: OG_PALETTE.inkMid,
          }}
        >
          — {siteSeo.brand}
        </div>
      </div>

      {/* Body: title + CTA pill */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
          marginTop: 12,
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 76,
            fontWeight: 700,
            lineHeight: 1.0,
            letterSpacing: '-0.03em',
            maxWidth: 1040,
            color: OG_PALETTE.inkDeep,
          }}
        >
          {title}
        </div>
        {cta && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              alignSelf: 'flex-start',
              gap: 10,
              padding: '12px 22px',
              borderRadius: 999,
              background: OG_PALETTE.accent,
              color: OG_PALETTE.paper,
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: '-0.005em',
            }}
          >
            {cta}
            <span style={{ display: 'flex', color: OG_PALETTE.paperWarm }}>→</span>
          </div>
        )}
      </div>

      {/* Footer: hairline divider + author/read time + host */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            height: 2,
            background: OG_PALETTE.ink,
            opacity: 0.18,
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 18,
            fontSize: 20,
            color: OG_PALETTE.ink,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontWeight: 700 }}>{author ?? siteSeo.brand}</span>
            {readTime && (
              <>
                <span style={{ opacity: 0.4 }}>·</span>
                <span style={{ opacity: 0.7 }}>{readTime}</span>
              </>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: OG_PALETTE.accent,
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            {siteHost}
            <span style={{ fontSize: 18 }}>↗</span>
          </div>
        </div>
      </div>
    </div>
  );
}
