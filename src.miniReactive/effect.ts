
type IDeps = Set<ReactiveEffect<any>>;
type IKeyToDepsMap = Map<string | symbol, IDeps>;
export interface IReactiveEffectOptions {
  lazy?: boolean;
}

const effectStack: ReactiveEffect<any>[] = [];
const targetDepsMap = new WeakMap<object, IKeyToDepsMap>();

class ReactiveEffect<R extends any> {
  public fn: (...args: any[]) => R;
  public deps: IDeps[] = [];
  public options: IReactiveEffectOptions;

  constructor(fn: (...args: any[]) => R) {
    this.fn = fn;
  }

  public run(...args: any[]) {
    // console.log('[Effect] run!!!!!!!!!!!!!!!!!!!')
    if (!effectStack.includes(this)) {
      this.cleanDeps();
      try {
        effectStack.push(this);
        return this.fn(...args);
      } finally {
        effectStack.pop();
      }
    }
  }

  protected cleanDeps() {
    for (let i = 0; i < this.deps.length; i++) {
      this.deps[i].delete(this);
    }
    this.deps.length = 0;
  }
}



export function effect<T extends any>(fn: () => T, options: IReactiveEffectOptions) {
  const effect = new ReactiveEffect(fn);
  effect.options = options;
  if (!options.lazy) {
    effect.run();
  }
  return effect;
}



export function track(target: object, key: string | symbol) {
  const effect = effectStack[effectStack.length - 1];
  if (!effect) {
    // console.log('[track] no actived effect', key);
    return;
  }

  let keyToDepsMap = targetDepsMap.get(target);
  if (keyToDepsMap === undefined) {
    keyToDepsMap = new Map();
    targetDepsMap.set(target, keyToDepsMap);
  }
  let deps = keyToDepsMap.get(key);
  if (deps === undefined) {
    deps = new Set();
    keyToDepsMap.set(key, deps);
  }

  // console.log('[track]', key, deps.has(effect));
  if (!deps.has(effect)) {
    deps.add(effect);
    effect.deps.push(deps);
  }
}

export function trigger(target: object, key: string | symbol) {
  const keyToDepsMap = targetDepsMap.get(target);
  if (!keyToDepsMap) {
    return;
  }
  const deps = keyToDepsMap.get(key);
  if (!deps) {
    return;
  }

  // console.log('[trigger] run effects~~~~', key, deps);
  deps.forEach((effect) => {
    // TODO: 校验循环调用
    Promise.resolve().then(() => {
      effect.run();
    })
  });
}
