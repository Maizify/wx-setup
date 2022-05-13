import { isRef } from '@vue/reactivity';
import { isArray, isObject } from '../src/utils';

export type IOnUpdate = (path: string, value: any, method: 'SET' | 'DELETE') => void;
export type IPrimitive = number | string | boolean | bigint | symbol | undefined | null;

enum TargetType {
  Object = 1,
  Array = 2,
}

function getKeyPath(parentType: TargetType, key: string | symbol, parentPath = '') {
  if (parentPath === '') {
    // when parentPath is "", it means parent is root,
    // then the child path should not be wrapped with `[]` or `.`.
    return String(key);
  }
  return parentPath + (parentType === TargetType.Array ? `[${String(key)}]` : `.${String(key)}`);
}

/**
 * Create a observable (reactive) object.  
 * 1. When the object is `Ref`, it won't be wrapped.  
 * 2. When getting a `Ref` property, the ref's value will be returned.
 * 3. When setting value to a `Ref` property, the ref's value will be set.  
 * 4. When setting a `Ref` to a property, 
 *    the property will be overwritten by this `Ref` even if it's already a `Ref`.
 */
function createObserve<T extends object>(target: T, onUpdate: IOnUpdate, parentType: TargetType = TargetType.Object, path = '') {
  if (!isObject(target) || isRef(target)) {
    return target;
  }

  const handler: ProxyHandler<T> = {
    get(target, key) {
      const currentPath = getKeyPath(parentType, key, path);
      const value = Reflect.get(target, key);
      console.log('[observe] GET::', key, currentPath, value);
      if (isRef(value)) {
        // TODO: 直接返回Ref？
        return value.value;
      } else {
        return createObserve(value, onUpdate, isArray(value) ? TargetType.Array : TargetType.Object, currentPath);
      }
    },
    set(target, key, value) {
      const currentPath = getKeyPath(parentType, key, path);
      console.log('[observe] SET::', key, currentPath, value);
      const oldValue = Reflect.get(target, key);
      const rawOldValue = isRef(oldValue) ? oldValue.value : oldValue;
      const rawNewValue = isRef(value) ? value.value : value;

      let result = true;
      if (rawOldValue !== rawNewValue) {
        if (isRef(oldValue)) {
          // 1. When setting value to a `Ref` property, the ref's value will be set. 
          oldValue.value = rawNewValue;
          result = Reflect.set(target, key, oldValue);
        } else {
          // 2. When setting a `Ref` to a property, 
          //    the property will be overwritten by this `Ref` even if it's already a `Ref`.
          // 3. When setting a normal value to a property,
          //    the property will be set as usual.
          result = Reflect.set(target, key, value);
        }
        
        if (result) {
          onUpdate && onUpdate(currentPath, value, 'SET');
        }
      }
      return result;
    },
    deleteProperty(target, key) {
      const currentPath = getKeyPath(parentType, key, path);
      // console.log('[observe] DeleteProperty::', key, currentPath);
      const result = Reflect.deleteProperty(target, key);
      if (result) {
        onUpdate && onUpdate(currentPath, undefined, 'DELETE');
      }
      return result;
    },
    // defineProperty(target, key, attributes) {
    //   const currentPath = getKeyPath(parentType, key, path);
    //   console.log('[reactive] DefineProperty::', key, attributes.value, currentPath);
    //   const result = Reflect.defineProperty(target, key, attributes);
    //   if (result) {
    //     onUpdate && onUpdate(currentPath, attributes.value, 'define');
    //   }
    //   return result;
    // },
  };

  return new Proxy(target, handler);
}

/**
 * Create a observable (reactive) object.
 */
export function observe<T extends object>(target: T, onUpdate: IOnUpdate) {
  return createObserve(target, onUpdate);
}

// function ref<T = any>(target: T) {
//   type Ref<V> = { value: V };
//   return new Proxy(<Ref<T>>{ value: target }, {
//     get(target, key) {
//       if (key === 'value') {
//         return Reflect.get(target, key);
//       }
//       if (key === '_ref') {
//         return true;
//       }
//     },
//     set(target, key, value) {
//       if (key === 'value') {
//         return Reflect.set(target, key, value);
//       }
//       return false;
//     }
//   });
// }

// function isRef(target: any) {
//   return isObject(target) && target._ref;
// }
