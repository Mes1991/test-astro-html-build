import type {
  AboutPage,
  CollectionPage,
  ContactPage,
  ItemList,
  ListItem,
  WithContext,
} from 'schema-dts';
import { siteSeo, localeTag } from '../defaults';
import type { LocaleCode } from '../types';

interface BasePageInput {
  name: string;
  url: string;
  description: string;
  locale?: LocaleCode;
}

export function buildAboutPage(input: BasePageInput): WithContext<AboutPage> {
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: input.name,
    url: input.url,
    description: input.description,
    inLanguage: localeTag[input.locale ?? 'en'],
    isPartOf: { '@type': 'WebSite', name: siteSeo.brand, url: siteSeo.siteUrl },
  };
}

export function buildContactPage(input: BasePageInput): WithContext<ContactPage> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: input.name,
    url: input.url,
    description: input.description,
    inLanguage: localeTag[input.locale ?? 'en'],
    isPartOf: { '@type': 'WebSite', name: siteSeo.brand, url: siteSeo.siteUrl },
  };
}

export interface CollectionItem {
  name: string;
  url: string;
}

/** CollectionPage with an ItemList of work entries. */
export function buildCollectionPage(
  input: BasePageInput & { items: readonly CollectionItem[] },
): WithContext<CollectionPage> {
  const itemListElement: ListItem[] = input.items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    url: item.url,
  }));
  const itemList: ItemList = {
    '@type': 'ItemList',
    itemListElement,
  };
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: input.name,
    url: input.url,
    description: input.description,
    inLanguage: localeTag[input.locale ?? 'en'],
    isPartOf: { '@type': 'WebSite', name: siteSeo.brand, url: siteSeo.siteUrl },
    mainEntity: itemList,
  };
}
