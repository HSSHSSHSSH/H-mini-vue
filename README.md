# 集成 TypeScript | jest 开发环境

- 集成 TypeScript

```
npm i typescript --dev
```

- 集成 jest

```
npm i jest @types/jest --dev
```

在 tsconfig.json 中的 types 项中添加 jest

-  集成 babel （使用 esm 规范） 

```
npm install --save-dev babel-jest @babel/core @babel/preset-env
```

创建 babel.config.js 文件，配置：

```js
module.exports = {
    presets: [['@babel/preset-env', {targets: {node: 'current'}}]],
}
```

为使 babel 支持 ts:

```
npm install --save-dev @babel/preset-typescript
```

babel.config.js

```js
module.exports = {
  presets: [
    ['@babel/preset-env', {targets: {node: 'current'}}],
    '@babel/preset-typescript',
  ],
};
```

# reactive 核心

## effect & reactive 收集依赖与触发依赖

一个响应式系统的工作流程应该包括：

- 在读取操作发生时，将副作用函数收集，即触发 get 操作时进行依赖收集
- 在设置操作发生时，遍历执行收集的所有副作用函数，即触发 set 操作时进行依赖触发

```reactive.spec.js
describe("reactive", () => {
  it("happy path", () => {
    const original = { foo: 1 }
    const observed = reactive(original)
    expect(observed).not.toBe(original)
    expect(observed.foo).toBe(1)
  })
})

```



```effect.spec.js

describe("effect", () => {
  it("happy path", () => {
    const user = reactive({
      age: 10
    })
    let nextAge
    effect(() => {
      nextAge = user.age + 1
    })
    expect(nextAge).toBe(11)
    user.age++
    expect(nextAge).toBe(12)
  })
})
```



故需要在 get 与 set 触发时进行拦截，在 ES2015+ 中可用 Proxy 来进行实现：

```js
function reactive(raw) {
    return new Proxy() {
        get(target, key) {
            track(target, key) // 进行依赖的收集
            const res = Reflect.get(target, key)
            return res
        },
        set(target, key, value) {
            const res = Reflect.set(target, key, value)
            trigger(target, key) // 进行依赖的触发
            return res
        }
    }
}
```

以下实现 track：

在收集依赖时，首先通过 target 找到其所有的 key 收集到的依赖，再通过 key 找到其收集到的所有依赖，将副作用函数收集；

故应存在：

- 一个 WeakMap ，键为所有进行过依赖收集的 target，值为 target 所有 key 的副作用函数  （为何使用 WeakMap 而非 Map）
-  一个Map，键为 target 的 key ，值为此 key 收集到的所有依赖
- 一个Set，为 key 所收集到的不可重复的依赖

```js
let targetMap = new WeakMap()
function track(target, key) {
    let depsMap = targetMap.get(target)
    let deps = depsMap.get(key)
    deps.add(activeEffect)
}
```

加上一些判断：

```js
let targetMap = new WeakMap()
function track(target, key) {
    let depsMap = targetMap.get(target)
    if (!depsMap) {
        targetMap.set(target, depsMap = new Map())
    }
    let deps = depsMap.get(key)
    if (!deps) {
        depsMap.set(key, deps = new Set())
    }
    deps.add(activeEffect)
}
```

以上即为收集依赖的核心流程，以下来实现触发依赖的流程：

通过target与key，在 targetMap 与 depsMap 中找到对应的依赖集合，循环遍历执行即可

```js
function trigger(target, key) {
    let depsMap = targetMap.get(target)
    let deps = depsMap.get(key)
    deps.forEach(effect => {
        effect()
    })
}
```

加上一些判断：

```js
function trigger(target, key) {
    let depsMap = targetMap.get(target)
    if (!depsMap) return
    let deps = depsMap.get(key)
    if (!deps) return
    deps.forEach(effect => {
        effect()
    })
}
```

在 track 中，有未定义的 activeEffect 变量，此为当前注册的副作用函数，以下来实现注册副作用函数功能，即 effect：

```js
let activeEffect
function effect(fn) {
    activeEffect = fn
    fn() // 在首次注册时，应运行副作用函数，触发依赖的收集
}
```

为了提高安全性，引入 class 对 effect 进行一些封装：

```js

class ReactiveEffect {
  private _fn: Function;
  constructor(fn) {
    this._fn = fn;
  }

  run() {
    activeEffect = this;
    this._fn()
  }
}

function effect (fn) {
  const _effect = new ReactiveEffect(fn)
  _effect.run()
}
```



整合以上代码：

```js
let targetMap = new WeakMap() // target 收集到的所有依赖
let activeEffect // 当前注册的副作用函数

class ReactiveEffect {
  private _fn: Function;
  constructor(fn) {
    this._fn = fn;
  }

  run() {
    activeEffect = this;
    this._fn()
  }
}

function reactive(raw) {
    return new Proxy() {
        get(target, key) {
            track(target, key) // 进行依赖的收集
            const res = Reflect.get(target, key)
            return res
        },
        set(target, key, value) {
            const res = Reflect.set(target, key, value)
            trigger(target, key) // 进行依赖的触发
            return res
        }
    }
}

function track(target, key) {
    let depsMap = targetMap.get(target)
    if (!depsMap) {
        targetMap.set(target, depsMap = new Map())
    }
    let deps = depsMap.get(key)
    if (!deps) {
        depsMap.set(key, deps = new Set())
    }
    deps.add(activeEffect)
}

function trigger(target, key) {
    let depsMap = targetMap.get(target)
    if (!depsMap) return
    let deps = depsMap.get(key)
    if (!deps) return
    deps.forEach(effect => {
        effect()
    })
}

function effect (fn) {
  const _effect = new ReactiveEffect(fn)
  _effect.run()
}
```

以上即为 reactive 与 effect 的简单实现，在 reactive 中使用 Proxy 结构，拦截 get 执行依赖的收集，拦截 set 进行依赖触发，通过 effect 函数进行副作用函数的注册。引入变量 activeEffect 与 targetMap 用于储存当前活跃的副作用函数与当前活跃的 target 所收集到的所有依赖。

## effect 返回 runner

(存在疑问，为何要返回 runner)

effect(fn) 执行后返回一个函数，记为 runner, runner 执行后会再次执行 fn  并得到 fn 的返回值，即

```effect.spec,js
describe("effect", () => {
  it("happy path", () => {
    ..其余代码..
  })
  it("shoule return runner when call effect", () => {
  	let foo = 10
    const runner = effect(() => {
      foo++
    })
    expect(foo).toBe(11)
    runner()
    expect(foo).toBe(12)
  })
})
```

完善 effect 

```js
function effect (fn) {
  const _effect = new ReactiveEffect(fn)
  _effect.run()
  return _effect.run.bind(_effect) // 绑定 this 指向
}
```



##  分支切换与 cleanup (清除遗留的副作用函数)

观察以下示例：

```cleanup.spec.js
describe('cleanup', () => {
  it('happy path', () => {
    // 每次执行副作用函数时，将其从与之有关的依赖项中删除
    const data = { ok: true, text: 'hello world' }
    const obj = reactive(data)

    let text = '哇哦~'

    let fn = jest.fn(() => {
      text = obj.ok ? obj.text : 'not'
    })

    effect(fn)

    expect(text).toBe('hello world')
    expect(fn).toHaveBeenCalledTimes(1)
    obj.ok = false
    expect(text).toBe('not')
    expect(fn).toHaveBeenCalledTimes(2)
    obj.text = 'hello world 2'
    expect(text).toBe('not')
    expect(fn).toHaveBeenCalledTimes(3)
    obj.ok = 0
    expect(fn).toHaveBeenCalledTimes(4)
    obj.text = 'hello world 3'
    expect(fn).toHaveBeenCalledTimes(5)
  })
})
```

当 obj.ok 为 false 时，即使对因 obj.text 进行 set 操作触发副作用函数时，并未改变对 text 的值进行变化，此时 obj.text 的依赖集合中此副作用函数即为遗留的副作用函数，我们希望可以清除这种副作用函数，即：

```cleanup.spec.js
describe('cleanup', () => {
  it('happy path', () => {
    // 每次执行副作用函数时，将其从与之有关的依赖项中删除
    const data = { ok: true, text: 'hello world' }
    const obj = reactive(data)

    let text = '蛙叫你'

    let fn = jest.fn(() => {
      text = obj.ok ? obj.text : 'not'
    })

    effect(fn)

    expect(text).toBe('hello world')
    expect(fn).toHaveBeenCalledTimes(1)
    obj.ok = false
    expect(text).toBe('not')
    expect(fn).toHaveBeenCalledTimes(2)
    obj.text = 'hello world 2'
    expect(text).toBe('not')
    expect(fn).toHaveBeenCalledTimes(2)
    obj.ok = 0
    expect(fn).toHaveBeenCalledTimes(3)
    obj.text = 'hello world 3'
    expect(fn).toHaveBeenCalledTimes(3)
  })
})
```



为通过以上测试，只需在副作用函数执行时，将其在包含此副作用函数的集合中删除，之后再进行 track 时，更新依赖集合。

需要一个新的数据结构，为包含目标副作用函数的依赖集合的集合，即一个集合，集合中元素为包含目标副作用函数的集合，此结构的初始化发生在第一次运行副作用函数时，即注册副作用函数时，即 effect 中，清除此集合的时机在副作用函数运行前，即：

```effect.ts
class ReactiveEffect {
  private _fn: Function;
  public deps: Set<any> | null; // 新增
  constructor(fn) {
    this._fn = fn;
    this.deps = new Set() // 新增 所有与该副作用函数相关的依赖项
  }

  run() {
    activeEffect = this;
    cleanup(activeEffext) // 新增 清除deps
    this._fn()
  }
}

function effect (fn) {
  const _effect = new ReactiveEffect(fn)
  _effect.run()
  return _effect.run.bind(_effect) // 绑定 this 指向
}

function cleanup(reactiveEffect) {
  const { deps } = reactiveEffect;
  if (deps) {
    deps.forEach(dep => {
      dep.delete(reactiveEffect);
    });
  }
  reactiveEffect.deps.clear()
}
```

此时运行测试会发生死循环，在于 trigger 中的 forEach，在 forEach 中运行了 effect.run()，run() 中运行了 cleanup() 与 fn()，fn()，在执行时进行了 track 操作，将 cleanup 中删除的项再次添加回来; 对于用 forEach 来遍历 set 操作，有：若一个值已被访问过，但该值被删除后又添加回集合中，若此时 forEach 未遍历结束，该值会被再次访问；故有：

```effect.ts
export function trigger (target, key) {
  let depsMap = targetMap.get(target)
  if (!depsMap) return
  let deps: Set<ReactiveEffect> = depsMap.get(key)
  if (!deps) return
  // deps.forEach(effect => { // 删除
  //   effect.run()
  // })
  let depsEffects = new Set(deps) // 新增
  depsEffects.forEach(effect => {  // 新增
    effect.run()
  })
}

```

完善后的代码如下：

```effect.ts

class ReactiveEffect {
  private _fn: Function;
  public deps: Set<any> | null;
  constructor(fn) {
    this._fn = fn;
    this.deps = new Set() // 所有与该副作用函数相关的依赖项
  }

  run() {
    activeEffect = this;
    cleanup(this);
    
    this._fn()
  }
}


// 收集依赖
// q: 为什么targetMap要用WeakMap
// a: 因为WeakMap的key是弱引用，当key被回收时，value也会被回收, 这样就不会造成内存泄漏.
let targetMap = new WeakMap()
export function track (target, key) {
  if(!activeEffect) return
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
export function trigger (target, key) {
  let depsMap = targetMap.get(target)
  if (!depsMap) return
  let deps: Set<ReactiveEffect> = depsMap.get(key)
  if (!deps) return
  // deps.forEach(effect => {
  //   effect.run()
  // })
  let depsEffects = new Set(deps)
  depsEffects.forEach(effect => {
    effect.run()
  })
}

let activeEffect : ReactiveEffect | null
export function effect (fn) { // 注册副作用函数
  const _effect = new ReactiveEffect(fn)
  _effect.run()
  
  return _effect.run.bind(_effect)
}

function cleanup(reactiveEffect) {
  const { deps } = reactiveEffect;
  if (deps) {
    deps.forEach(dep => {
      dep.delete(reactiveEffect);
    });
  }
  reactiveEffect.deps.clear()
}
```



## 嵌套 effect 与 effect 栈

effect 满足嵌套是必要的，比如父子组件的嵌套渲染。

考虑以下代码的执行：

```	JS
let obj = reactive({
    foo: true,
    bar: true
})

let temp1, temp2

effect(() => {
    console.log('外层函数执行')
    effect(() => {
        console.log('内层函数执行')
        temp2 = obj.bar
    })
    temp1 = obj.foo
})
```

运行以上代码后，输出值与变量赋值皆正常，我们希望当改变 obj.foo 时，外层函数执行并间接执行内层函数；当改变 obj.bar 时，仅执行内层函数；

在实际运行时，无论改变 obj.foo 或 obj.bar，均执行内层函数，问题在于 activeEffect 中，我们以下记外层函数为 fn1，内层函数为 fn2，副作用函数为 fn1 与 fn2 的 ReactiveEffect 示例为 ReactiveEffect1，ReactiveEffect2:

当 effect 中的 fn1 执行时，此时的 activeEffect 为 ReactiveEffect1，在未对 obj.foo 进行 get 操作时，进入了 fn2 的执行，此时的 activeEffect 为 ReactiveEffect2，对 obj.bar 正常进行 get 与 track 操作，在对 obj.foo 进行 track 操作时的 activeEffect 仍为 ReactiveEffect2，故 obj.foo 的依赖副作用函数亦为 fn2，此时无论更改 obj.foo 或 obj.bar，触发的都是 fn2，fn1 未被当作副作用函数。

为解决此问题，<strong>引入一调用栈，其元素为 ReactiveEffect 实例，且 activeEffect 始终指向位于栈顶的元素</strong>， 

## effect 的可调度行 scheduler

可调度性是响应式系统重要的组成部分，所谓可调度性即为当trigger触发副作用函数时，有能力决定副作用函数的执行时机、次数、方式。





