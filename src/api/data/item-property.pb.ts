/* eslint-disable */

/**
 * SortableProperty is used to reference a sortable (i.e. locally indexed)
 * property within an item. These properties are either built in, or they must
 * be explicitly declared in the schema / store config so they can be populated
 * when items are written/updated.
 */
export const SortableProperty = {
  /**
   * KEY_PATH - SORTABLE_PROPERTY_KEY_PATH is the full key path of the item. This is the
   * default sort property if none is specified. TODO: Document how these are ordered.
   */
  KEY_PATH: 0,
  /**
   * LAST_MODIFIED_VERSION - SORTABLE_PROPERTY_LAST_MODIFIED_VERSION sorts by the last modified version
   * of the items, with ascending order being from oldest to newest. This is
   * only available if the store / item is configured to track last modified
   * versions.
   */
  LAST_MODIFIED_VERSION: 1,
  /**
   * CUSTOM_1 - SORTABLE_PROPERTY_CUSTOM_1 through SORTABLE_PROPERTY_CUSTOM_4 are user-specified sortable
   * properties which may be defined in the schema. The maximum supported number
   * of custom properties currently depends on the store configuration and the
   * underlying database platform.
   */
  CUSTOM_1: 8,
  CUSTOM_2: 9,
  CUSTOM_3: 10,
  CUSTOM_4: 11,
  UNRECOGNIZED: -1,
} as const;

export type SortableProperty = (typeof SortableProperty)[keyof typeof SortableProperty];

export namespace SortableProperty {
  export type KEY_PATH = typeof SortableProperty.KEY_PATH;
  export type LAST_MODIFIED_VERSION = typeof SortableProperty.LAST_MODIFIED_VERSION;
  export type CUSTOM_1 = typeof SortableProperty.CUSTOM_1;
  export type CUSTOM_2 = typeof SortableProperty.CUSTOM_2;
  export type CUSTOM_3 = typeof SortableProperty.CUSTOM_3;
  export type CUSTOM_4 = typeof SortableProperty.CUSTOM_4;
  export type UNRECOGNIZED = typeof SortableProperty.UNRECOGNIZED;
}
