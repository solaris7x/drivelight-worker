/**
 * Check if object has given properties
 * @param obj Object to  check
 * @param props string array of keys to check
 * @returns boolean
 */
export const hasAllProperties = <T>(obj: any, props: (keyof T)[]): obj is T => {
  if (!obj) {
    return false
  }
  return props.every((prop) => Object.prototype.hasOwnProperty.call(obj, prop))
}

export const isArrayOf = <T>(obj: any, props: (keyof T)[]): obj is T[] => {
  if (!Array.isArray(obj)) {
    return false
  }
  return obj.every((ele) => hasAllProperties(ele, props))
}
