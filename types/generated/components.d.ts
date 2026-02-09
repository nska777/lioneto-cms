import type { Schema, Struct } from '@strapi/strapi';

export interface SharedLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_links';
  info: {
    displayName: 'link';
    icon: 'paperPlane';
  };
  attributes: {
    href: Schema.Attribute.String;
    isActive: Schema.Attribute.Boolean;
    isExternal: Schema.Attribute.Boolean;
    label: Schema.Attribute.String;
  };
}

export interface SharedRegionAddress extends Struct.ComponentSchema {
  collectionName: 'components_shared_region_addresses';
  info: {
    displayName: 'region-address';
  };
  attributes: {
    addressLine: Schema.Attribute.String;
    addressLine_uz: Schema.Attribute.String;
    city: Schema.Attribute.String;
    city_uz: Schema.Attribute.String;
    mapUrl: Schema.Attribute.String;
    region: Schema.Attribute.Enumeration<['uz', 'ru']>;
    workTime: Schema.Attribute.String;
    workTime_uz: Schema.Attribute.String;
  };
}

export interface SharedRegionPhone extends Struct.ComponentSchema {
  collectionName: 'components_shared_region_phones';
  info: {
    displayName: 'region-phone';
    icon: 'phone';
  };
  attributes: {
    phone: Schema.Attribute.String;
    region: Schema.Attribute.Enumeration<['uz', 'ru']>;
  };
}

export interface SharedSocial extends Struct.ComponentSchema {
  collectionName: 'components_shared_socials';
  info: {
    displayName: 'social';
    icon: 'twitter';
  };
  attributes: {
    type: Schema.Attribute.Enumeration<
      ['telegram', 'whatsapp', 'youtube', 'tiktok']
    >;
    url: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'shared.link': SharedLink;
      'shared.region-address': SharedRegionAddress;
      'shared.region-phone': SharedRegionPhone;
      'shared.social': SharedSocial;
    }
  }
}
