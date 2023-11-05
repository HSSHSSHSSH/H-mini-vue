let activeEffect: ReactiveEffect | null // 当前活跃的 ReactiveEffect 实例
let effectStack: ReactiveEffect[] = [] // 用于存储副作用函数的栈
let targetMap = new WeakMap() // 用于存储依赖项的 Map



class ReactiveEffect {
  private _fn: Function
  public deps: Set<any> | null // 与该副作用函数相关的依赖项
  public options: {
    scheduler?: Function,
    onStop?: Function
  } | null // 副作用函数的配置项
  private _isStop: boolean = false // 是否停止
  constructor(fn, options) {
    this._fn = fn
    this.deps = new Set() // 所有与该副作用函数相关的依赖项
    this.options = options
  }

  run() {
    activeEffect = this
    // 将 activeEffect 放入 effectStack 的首位
    effectStack.push(this)
    cleanup(this)
    this._fn()
    // 将 activeEffect 从 effectStack 中移除
    effectStack.pop()
    activeEffect = effectStack[effectStack.length - 1]
  }

  stop() {
    if (this._isStop) return
    if(this.options && this.options.onStop) {
      this.options.onStop()
    }
    cleanup(this)
  }
}

// 收集依赖
// q: 为什么targetMap要用WeakMap
// a: 因为WeakMap的key是弱引用，当key被回收时，value也会被回收, 这样就不会造成内存泄漏.
export function track(target, key) {
  if (!activeEffect) return
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  let deps = depsMap.get(key)
  if (!deps) {
    depsMap.set(key, (deps = new Set()))
  }
  deps.add(activeEffect)
  if (!activeEffect.deps) {
    activeEffect.deps = new Set()
  }
  activeEffect.deps.add(deps)
}

// 触发依赖
export function trigger(target, key) {
  let depsMap = targetMap.get(target)
  if (!depsMap) return
  let deps: Set<ReactiveEffect> = depsMap.get(key)
  if (!deps) return
  // deps.forEach(effect => {
  //   effect.run()
  // })
  let depsEffects = new Set(deps)
  depsEffects.forEach((effect) => {
    if (effect.options && effect.options.scheduler) { // 如果有配置scheduler，则执行scheduler
      effect.options.scheduler(effect.run.bind(effect))
    } else {
      effect.run()
    }
  })
}


export function effect(fn, options = {}) {
  // 注册副作用函数
  const _effect = new ReactiveEffect(fn, options)
  _effect.run()
  const runner: any = _effect.run.bind(_effect)
  runner.stop = _effect.stop.bind(_effect)
  return runner
}

function cleanup(reactiveEffect) {
  const { deps } = reactiveEffect
  if (deps) {
    deps.forEach((dep) => {
      dep.delete(reactiveEffect)
    })
  }
  reactiveEffect.deps.clear()
}
