
class ReactiveEffect {
  constructor(fn) {
    this._fn = fn;
  }

  run() {
    activeEffect = this;
    this._fn()
  }
}


// 收集依赖
// q: 为什么targetMap要用WeakMap
// a: 因为WeakMap的key是弱引用，当key被回收时，value也会被回收, 这样就不会造成内存泄漏.
let targetMap = new WeakMap()
function track (target, key) {
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  let deps = depsMap.get(key)
  if (!deps) {
    depsMap.set(key, (deps = new Set()))
  }
  deps.add(activeEffect)
}

// 触发依赖
function trigger (target, key) {
  let depsMap = targetMap.get(target)
  if (!depsMap) return
  let deps = depsMap.get(key)
  if (!deps) return
  deps.forEach(effect => {
    effect.run()
  })
}

let activeEffect
function effect (fn) { // 注册副作用函数
  const _effect = new ReactiveEffect(fn)
  _effect.run()
  return _effect.run.bind(_effect)
}

module.exports = {
  effect,
  track,
  trigger
}