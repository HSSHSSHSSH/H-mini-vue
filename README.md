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

### Effect

#### effect 返回 runner

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

#### 分支切换与 cleanup (清除遗留的副作用函数)

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

#### 嵌套 effect 与 effect 栈，正确收集依赖

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

为解决依赖收集混乱的问题，<strong>引入一调用栈，其元素为 ReactiveEffect 实例，且 activeEffect 始终指向位于栈顶的元素</strong>。

```ts
let effectStack : ReactiveEffect[] = [] // 用于存储副作用函数的栈
class Reactive {
    // .... 其余代码.... //
    run() {
    activeEffect = this;
    // 将 activeEffect 放入 effectStack 的首位
    effectStack.push(this)
    cleanup(this);
    this._fn()
    // 将 activeEffect 从 effectStack 中移除
    effectStack.pop()
    activeEffect = effectStack[effectStack.length - 1]
  }
}
```

这样即可避免依赖收集混乱的问题，以下还需注意：当外层副作用函数执行后，会再次执行内层的 effect 函数用于再次注册内层副作用函数，在依赖 Set 中无法区别相同 fn 的 ReactiveEffect，会在依赖集合中有多个相同 fn 的 ReactiveEffect，此时再次修改内层副作用函数的响应式数据会导致多次执行内层副作用函数（并非相同的 Reactiveffect，而是多个不同的 ReactiveEffect 的 fn 相同）；例如：

```js
import { reactive } from '../reactive'
import { effect } from '../effect'


describe('nestification', () => {
  it('happy path', () => {
    const obj = reactive({
      foo: '000',
      bar: '111'
    })

    let temp1, temp2
    let outer_called_times = 0
    let inner_called_times = 0

    function innerFunction () {
      inner_called_times++
      temp2 = obj.bar
    }

    function outerFunction () {
      outer_called_times++
      effect(innerFunction)
      temp1 = obj.foo
    }

    effect(outerFunction)

    expect(temp1).toBe('000')
    expect(temp2).toBe('111')
    expect(outer_called_times).toBe(1)
    expect(inner_called_times).toBe(1)

    obj.bar = '333'

    expect(temp1).toBe('000')
    expect(temp2).toBe('333')
    expect(outer_called_times).toBe(1)
    expect(inner_called_times).toBe(2)

    obj.foo = '444'

    expect(temp1).toBe('444')
    expect(temp2).toBe('333')
    expect(outer_called_times).toBe(2)
    expect(inner_called_times).toBe(3)

    obj.foo = '555'
    expect(temp1).toBe('555')
    expect(temp2).toBe('333')
    expect(outer_called_times).toBe(3)
    expect(inner_called_times).toBe(4)
    
    obj.bar = '666'
    expect(temp1).toBe('555')
    expect(temp2).toBe('666')
    expect(outer_called_times).toBe(3)
    expect(inner_called_times).toBe(7)

  })
})
```

#### effect 的可调度行 scheduler

可调度性是响应式系统重要的组成部分，所谓可调度性即为当trigger触发副作用函数时，有能力决定副作用函数的执行时机、次数、方式。

由上述描述可知，scheduler 满足：

- 仅在 trigger 中执行，在首次注册副作用函数时不执行
- 可对副作用函数 fn 进行操作，故必有 fn 作为其参数

例如每次在 trigger 中触发副作用函数时，将其延迟 1 秒：

```ts
effect(fn, {
    scheduler: (fn) => {
        setTimeout(fn, 0)
    }
})
```

需要在注册函数 effect 与 ReactiveEffect 中添加新的参数，即：

```effect.ts
class ReactiveEffect {
  private _fn: Function
  public deps: Set<any> | null // 与该副作用函数相关的依赖项
  public options: {
    scheduler?: Function
  } | null // 新增 副作用函数的配置项
  constructor(fn, options) {
    this._fn = fn
    this.deps = new Set() // 所有与该副作用函数相关的依赖项
    this.options = options // 新增
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
}
//....其余代码...//
export function effect(fn, options = {}) {
  // 注册副作用函数
  const _effect = new ReactiveEffect(fn, options)
  _effect.run()

  return _effect.run.bind(_effect)
}
```

在 trigger 调用时，判断当前 ReactiveEffect 的配置项是否包含 scheduler，若有则执行 scheduler 并将 run 函数作为参数传入，注意 this 指向：

```effect.ts
//...其余代码....//
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
    if (effect.options && effect.options.scheduler) { // 新增 如果有配置scheduler，则执行scheduler
      effect.options.scheduler(effect.run.bind(effect)) // 注意 this 指向
    } else {
      effect.run()
    }
  })
}
//...其余代码....//
```

#### effect 的 stop 功能

我们希望一些副作用函数可以在某个时刻之后不再触发，且在此时刻做一些额外的事情，即

```effect.spec.ts
it('stop', () => {
    let dummy
    const obj = reactive({ prop: 1 })
    const runner = effect(() => {
      dummy = obj.prop
    })
    obj.prop = 2
    expect(dummy).toBe(2)
    runner.stop()
    obj.prop = 3
    expect(dummy).toBe(2)
    // stopped effect should still be manually callable
    runner()
    expect(dummy).toBe(3)
  })

  it('onStop', () => {
    const obj = reactive({ foo: 1 })
    const onStop = jest.fn()
    let dummy
    const runner = effect(
      () => {
        dummy = obj.foo
      },
      {
        onStop
      }
    )
    runner.stop()
    expect(onStop).toHaveBeenCalledTimes(1)
  })
```

在 effect 函数返回的 runner 中添加 stop 函数属性，stop 即为 cleanup，为保证不重复操作 stop，可引入一变量表示是否调用过 stop，在 options 中添加 onStop 属性，并在 stop 中 cleanup 之前调用：

```effect.ts
class ReactiveEffect {
    private _isStop: boolean = false // 新增 是否停止
    public options: {
    scheduler?: Function,
    onStop?: Function // 新增
  } | null // 副作用函数的配置项
	//....其余代码....//
	stop() { // 新增
    if (this._isStop) return
    if(this.options && this.options.onStop) {
      this.options.onStop()
    }
    cleanup(this)
  }
}

//...其余代码....//
export function effect(fn, options = {}) {
  // 注册副作用函数
  const _effect = new ReactiveEffect(fn, options)
  _effect.run()
  const runner: any = _effect.run.bind(_effect)
  runner.stop = _effect.stop.bind(_effect) // 新增
  return runner
}
```



### Reactive

#### readonly 功能

有时我们希望对一些数据进行保护，当用户尝试修改数据时，会得到一条警告，即只读属性 readonly；

只需修改 reactive 函数，去掉 set 操作与 get 中的 track 操作：

```reactive.ts
import { track, trigger } from './effect'

export function reactive(raw) {
  return new Proxy(raw, {
    get(target, key) {
      // 依赖收集
      track(target, key)
      return Reflect.get(target, key)
    },
    set(target, key, value) {
      // 触发依赖
      let res = Reflect.set(target, key, value)
      trigger(target, key)
      return res
    },
  })
}


export function readonly(raw) {
  return new Proxy(raw, {
    get(target, key) {
      return Reflect.get(target, key)
    },
    set() {
      // todo 抛出异常或警告
      return true
    },
  })
}
```

将上述代码中的重复部分提取，整理以上代码：

```reactive.ts
import { mutableHandlers, readonlyHandlers } from './baseHandles'



function  createActiveObject(raw, baseHandlers) {
  return new Proxy(raw, baseHandlers)
}

export function reactive(raw) {
  return createActiveObject(raw, mutableHandlers)
}


export function readonly(raw) {
  return createActiveObject(raw, readonlyHandlers)
}


```



```baseHandlers.ts
import { track, trigger } from "./effect"


const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(true)



function createGetter(isReadonly: boolean = false) {
  return function get(target, key) {
   if (!isReadonly) {
     // 依赖收集
     track(target, key)
   }
    return Reflect.get(target, key)
  }
}

function createSetter() {
  return function set(target, key, value) {
    let res = Reflect.set(target, key, value)
    // 触发依赖
    trigger(target, key)
    return res
  }
}


export const mutableHandlers = {
  get,
  set
}


export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key, value) {
    console.warn('只读属性，虾吗？')
    return true
  }
}
```



#### isReadonly 、 isReactive、shallowReadonly、shallowReactive、isProxy

用来判断一个数据是否为响应式数据与只读数据。

只需在 proxy 中的 get 操作拦截处做判断返回即可。

```reactive.ts
//...其余代码...//
export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly'
}

export function isReactive(value) {
  return !!value[ReactiveFlags.IS_REACTIVE]
}

export function isReadonly(value) {
  return !!value[ReactiveFlags.IS_READONLY]
}
```



```baseHandlers
//..其余代码...//
function createGetter(isReadonly: boolean = false) {
  return function get(target, key) {
    if(key === ReactiveFlags.IS_REACTIVE) { // 新增
      return !isReadonly
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly
    }
    if (!isReadonly) {
     // 依赖收集
     track(target, key)
   }
    return Reflect.get(target, key)
  }
}
```



reactive 与 readonly 应支持嵌套功能，即：

```reactive.spec.ts
//...其余代码...//
it("nested reactive", () => {
    const original = {
      nested: {
        foo: 1
      },
      array: [{ bar: 2 }]
    }
    const observed = reactive(original)
    expect(isReactive(observed.nested)).toBe(true)
    expect(isReactive(observed.array)).toBe(true)
    expect(isReactive(observed.array[0])).toBe(true)
  })
```



```readonly.spec.ts
//...其余代码...//
it('nested readonly', () => {
    const original = {
      nested: {
        foo: 1
      },
      array: [{ bar: 2 }]
    }
    const wrapped = readonly(original)
    expect(isReadonly(wrapped.nested)).toBe(true)
    expect(isReadonly(wrapped.array)).toBe(true)
    expect(isReadonly(wrapped.array[0])).toBe(true)
  })
```



同样在 proxy 的 get 拦截处进行判断操作：

```baseHandlers.ts
function createGetter(isReadonly: boolean = false) {
  return function get(target, key) {
    if(key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly
    }

    const res = Reflect.get(target, key)

    if(isObject(res)) {  // 新增
      return isReadonly ? readonly(res) : reactive(res)
    }

    if (!isReadonly) {
     // 依赖收集
     track(target, key)
   }
    return res
  }
}
```





```shared/index.ts
export function isObject(value) {
  return typeof value === 'object' && value !== null
}
```

有时我们希望 readonly 数据中的非嵌套数据为 readonly，嵌套数据无需，reactive 同理，可使用 shallowReadonly，shallowReactive即：

```readonly.spec.ts
it('shallow readonly', () => {
    const original = {
      nested: {
        foo: 1
      },
      array: [{ bar: 2 }]
    }
    const wrapped = shallowReadonly(original)
    expect(isReadonly(wrapped)).toBe(true)
    expect(isReadonly(wrapped.nested)).toBe(false)
    expect(isReadonly(wrapped.array)).toBe(false)
    expect(isReadonly(wrapped.array[0])).toBe(false)
  })
```



```reactive.spec.ts
it('shallow reactive', () => {
    const original = {
      nested: {
        foo: 1
      },
      array: [{ bar: 2 }]
    }
    const wrapped = shallowReactive(original)
    expect(isReactive(wrapped)).toBe(true)
    expect(isReactive(wrapped.nested)).toBe(false)
    expect(isReactive(wrapped.array)).toBe(false)
    expect(isReactive(wrapped.array[0])).toBe(false)
  })
```





同样在 proxy 进行 get 操作的拦截处进行判断

```baseHanlders.ts
function createGetter(isReadonly: boolean = false, isShallow: boolean = false) {
  return function get(target, key) {
    if(key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly
    }

    const res = Reflect.get(target, key)

    if(isShallow) {  // 新增
      return res
    }

    if(isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res)
    }

    if (!isReadonly) {
     // 依赖收集
     track(target, key)
   }
    return res
  }
}
```

shallowReactive 与 shallowReadonly 仅在 get 创建时的参数不同，即：

```reactive.ts
export function shallowReadonly(raw) {
  return createActiveObject(raw, shallowReadonlyHandlers)
}

export function shallowReactive(raw) {
  return createActiveObject(raw, shallowReactiveHandlers)
}

```

```baseHandlers.ts
const shallowReadonlyGet = createGetter(true, true)
const shallowReactiveGet = createGetter(false, true)
```



isProxy 用于判断一数据类型是否为 reactive、readonly、shallowReactive、shallowReadonly 创建：

```isProxy.spec.ts
describe('isProxy', () => {
  it('happy path', () => {
    const obj = { foo : 1, nested: { bar: 2 }, array: [{ baz: 3 }] }
    const reactive_obj = reactive(obj)
    const readonly_obj = readonly(obj)
    const shallow_reactive_obj = shallowReactive(obj)
    const shallow_readonly_obj = shallowReadonly(obj)
    expect(isProxy(obj)).toBe(false)
    expect(isProxy(reactive_obj)).toBe(true)
    expect(isProxy(readonly_obj)).toBe(true)
    expect(isProxy(shallow_reactive_obj)).toBe(true)
    expect(isProxy(shallow_readonly_obj)).toBe(true)
  })
})
```



```reactive.ts
export function isProxy(raw) {
  return isReactive(raw) || isReadonly(raw)
}
```



#### ref

