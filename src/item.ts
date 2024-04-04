import type { Item as ApiItem, ItemMetadata as ApiItemMetadata } from "./api/data/item.pb.js";
import { parseKeyPath, type Item, type ItemMetadata, type JSONObject } from "./data.js";

/** @private */
export function convertToItem<T extends JSONObject>(i: ApiItem): Item<T> {
  const itemKey = parseKeyPath(i.keyPath);
  const lastPathPart = itemKey.pop()!;
  const { itemType, id } = lastPathPart;
  return {
    keyPath: i.keyPath,
    id,
    itemType,
    parentKeyPath: itemKey,
    metadata: convertMetadata(i.metadata!),
    data: i.json as T,
  };
}

/** @private */
export function convertMetadata(i: ApiItemMetadata): ItemMetadata {
  return {
    createdAt: new Date(Number(i.createdAtMicros / BigInt(1000))),
    lastModifiedAt: new Date(Number(i.lastModifiedAtMicros / BigInt(1000))),
    createdAtVersion: i.createdAtVersion,
    lastModifiedAtVersion: i.lastModifiedAtVersion,
  };
}
