import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import type { ReactNode } from 'react';
import { ogFontConfig } from './fonts';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/** Render a JSX template to a PNG Uint8Array (1200×630). */
export async function renderOg(node: ReactNode): Promise<Uint8Array> {
  const fonts = await ogFontConfig();
  const svg = await satori(node, {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts,
  });
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: OG_WIDTH },
  })
    .render()
    .asPng();
  return new Uint8Array(png);
}
