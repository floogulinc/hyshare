export function getTagValue(tag: string) {
  if (!tag) {
    return tag;
  }
  if (!tag.includes(':')) {
    return tag;
  }
  return tag.split(':')[1].toLowerCase();
}

export function getNamespace(tag: string): string {
  if (!tag?.includes(':')) {
    return '';
  }
  return tag.split(':')[0].toLowerCase();
}

export function firstNamespaceTag(tags: string[], namespace: string) {
  return tags.find((t) => t.startsWith(namespace + ':'));
}

export function namespaceTags(tags: string[], namespace: string) {
  return tags.filter((t) => t.startsWith(namespace + ':'));
}

export function flattenTagServices(tagServicesToTags: {
  [serviceName: string]: string[];
}) {
  return Object.values(tagServicesToTags).flat();
}

export const namespaceRegex = /(.+?):(.+)/;
