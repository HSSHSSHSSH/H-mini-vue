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

# reactive 

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



#### watch

watch 的实现基于 effect 的 scheduler，本质上是注册一个带有 scheduler 的副作用函数，即对 effect 的二次封装。

watch接受两个参数，一个为观测的对象，一个为观测对象变化后触发的回调，回调在第一次不执行，往后每次观测对象发生变化时，执行回调，即：

```watch.spec.ts
describe('watch', () => {
	it('happy path', () => {
		const obj = reactive({
			foo: 1
		})
        const fn = jest.fn(() => {
        	return obj.foo
        })
		watch(obj,fn)
		expect(fn).toHaveBeenCalledTimes(0)
		obj.foo = 2
		expect(fn).toHaveBeenCalledTimes(1)
	})
})
```

根据上述对回调的表述，符合 effect 的 scheduler ，故有：

```watch.ts
function watch(source, cb) {
	effect(() => traverse(source), {
		scheduler: cb
	})
}

function traverse(value: any, seen = new Set()) { // 更通用的读取操作
  // 若要读取的值是原始值，或已被读取，则直接返回
  if(typeof value !== 'object' || value === null || seen.has(value)) return
 
  // 表示当前 value 被读取
  seen.add(value)

  // 遍历读取 value 的所有属性
  for(let key in value) {
    traverse(value[key], seen)
  }

  return value
}
```



watch 观测的对象有可能是一个 getter函数，即：

```watch.spec.ts
it('receive getter', () => {
    const obj = reactive({
      foo: 1
    })

    const fn = jest.fn()

    watch(
      () => obj.foo,
      fn
    )

    expect(fn).toHaveBeenCalledTimes(0)
    obj.foo++
    expect(fn).toHaveBeenCalledTimes(1)

 })
```

只需判断观测的对象是否为函数，然后再进行赋值即可：

```watch.ts
export function watch(source, cb) {
  let getter = typeof source === 'function' ?  source : () => traverse(source)
	effect(() => getter(), {
		scheduler: () => cb()
	})
}
```

再使用时，我们通常想要同时拿到新值与旧值，此时需要实现 effect 的 lazy 属性：

```watch.spec.ts
  it('get newVal and oldVal', () => {
    const obj = reactive({
      foo: 1
    })

    let dummy
    watch(
      () => obj.foo,
      (newVal, oldVal) => {
        dummy = [newVal, oldVal]
      }
    )

    obj.foo++
    expect(dummy).toEqual([2, 1])
  })
```





lazy 若为 true，在 effect 中副作用函数不会立即执行，需要我们手动执行，这样就有了对 newVal 与 oldVal 的操作空间；即在 watch 中手动调用副作用函数；在 effect 中加入 lazy 后的代码如下：

```effect.ts
export function effect(fn, options: any = {}) {
  // 注册副作用函数
  const _effect = new ReactiveEffect(fn, options)
  if (!options.lazy) { // 新增
    _effect.run()
  }
  const runner: any = _effect.run.bind(_effect)
  runner.stop = _effect.stop.bind(_effect)
  return runner
}
```



watch 完善后的代码如下：

```watch.ts
export function watch(source, cb) {
  let oldVal, newVal
  let getter = typeof source === 'function' ?  source : () => traverse(source)
	const runner = effect(() => getter(), {
		scheduler: () => {
      newVal = runner()
      cb(newVal, oldVal)
      oldVal = newVal
    },
    lazy: true
	})
  oldVal = runner() // 仅第一次执行
}
```

有时我们希望 watch 注册的副作用函数立即执行，即 immediate：

```watch.spec.ts
it('immediate', () => {
    const obj = reactive({
      foo: 1
    })

    let dummy
    const fn = jest.fn((newVal, oldVal) => {
      dummy = [newVal, oldVal]
    },)
    watch(
      () => obj.foo,
      fn,
      { immediate: true }
    )
    expect(fn).toHaveBeenCalledTimes(1)
    expect(dummy).toEqual([1, undefined])
  })
```

只需加一个判断即可：

```watch.ts
export function watch(source, cb,options:any = {}) {
  let oldVal, newVal
  const scheduler = () => {
    newVal = runner()
    cb(newVal, oldVal)
    oldVal = newVal
  }
  let getter = typeof source === 'function' ?  source : () => traverse(source)
	const runner = effect(() => getter(), {
		scheduler,
    lazy: true
	})
  if (options.immediate) {
    scheduler()
  } else {
    
    oldVal = runner() // 仅第一次执行
  }
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

官方文档中对 ref 的定义如下：

ref 对象是可更改的，也就是说你可以为 `.value` 赋予新的值。它也是响应式的，即所有对 `.value` 的操作都将被追踪，并且写操作会触发与之相关的副作用。

如果将一个对象赋值给 ref，那么这个对象将通过 reactive 转为具有深层次响应式的对象。这也意味着如果对象中包含了嵌套的 ref，它们将被深层地解包。



由上述描述，我们可知：

- ref 对象有一 value 属性，即 ref 对象的操作核心
- ref 满足响应式数据
- 若传入的变量为一对象，则通过 reactive 转化为响应式数据

则有：

```ref.spec.ts
describe('ref', () => {
	it('happy path', () => {
		const a = ref(1)
		expect(a.value).toBe(1)
	})
	
	it('shoule be reactive', () => {
		const a = ref(1)
		let dummy
		let calls = 0
		
		effect(() => {
			dummy = a.value + 1
			calls++
		})
        
        expect(dummy).toBe(2)
        expect(calls).toBe(1)
        
        a.value = 2
        expect(dummy)toBe(3)
        expect(calls.toBe(2)
        
        // 相同的值不触发 set
        a.value = 2
        expect(dummy)toBe(3)
        expect(calls.toBe(2)
		
	})
	
	it('should make nested properties reactive', () => {
		const a = ref({
			count: 1
		})
		
		let dummy
		
		effect(() => {
			dummy = a.value.count + 1
		})
		
		expect(dummy).toBe(2)
		
		a.value.count = 2
		
		expect(dummy).toBe(3)
		
		
	})
	
})
```



因 ref 在实际使用时常传入的是值类型，无法使用 proxy，故我们需自行创建一类，拦截 get 与 set 操作：

``` ref.ts
class RefImpl {
	private _value: any
	constructor(value) {
		this._value = value
	}
	
	get value() {
		// 执行副作用函数的收集 即 track
		return this._value
	}
	
	set value(newVal) {
		if (Object.is(this._value, newVal)) return // 相同的值不进行set
		// 执行副作用函数集合的触发 即 trigger
		this._value = newVal
	}
	 	
}

function ref(value) {
	return new RefImpl(value)
}

```

此时 happy path 测试已通过。

以下进行依赖的收集与触发，在 RefImpl 中添加 deps 为副作用函数的集合：

```ref.ts
class RefImpl {
	//..其余代码...//
	private _deps:Set<any>
	
	constructor(value) {
		//...其余代码...//
		this._dps = new Set()
	}
	//..其余代码...//
}
```

观察之前实现的 track 代码与 trigger 代码：

```effect.ts
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
```

包括了找到正确的副作用函数集合，收集/触发集合中的元素两部分，在 ref 中我们已知正确的依赖集合，故可将 track 与 trigger 函数的触发依赖几个的代码抽离，即：

```effect.ts
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
  trackEffect(deps) // 抽离收集的部分
}

export function trackEffect(deps: Set<any>) {
  if (!activeEffect) return
  deps.add(activeEffect)
  if (!activeEffect.deps) {
    activeEffect.deps = new Set()
  }
  activeEffect.deps.add(deps)
}

export function trigger(target, key) {
  let depsMap = targetMap.get(target)
  if (!depsMap) return
  let deps: Set<ReactiveEffect> = depsMap.get(key)
  if (!deps) return
  triggerEffect(deps) // 抽离触发的部分
}

export function triggerEffect(deps: Set<any>) {  
  let depsEffects = new Set(deps)
  depsEffects.forEach((effect) => {
    if (effect.options && effect.options.scheduler) { // 如果有配置scheduler，则执行scheduler
      effect.options.scheduler(effect.run.bind(effect))
    } else {
      effect.run()
    }
  })
}
```

在 ref 中仅使用收集/触发的操作，即：

```ref.ts
class RefImpl {
	//其余代码//
	
	get value() {
		trackEffect(this._deps)
		return this._value
	}
	set value(newVal) {
		if (Object.is(this._value, newVal)) return // 相同的值不进行set
		// 执行副作用函数集合的触发 即 trigger
		this._value = newVal
		triggerEffect(this._deps)
	}
}
```

此时 shoule be reactive 测试通过。

对于 shoule make nested properties reactive 测试，仅需在 constructor 中判断 value 是否为引用类型并用 reactive 包裹即可：

```ref.ts
class RefImpl {
	//..其余代码..//
	constructor (value) {
		this._value = isObject(value) ? reactive(value) : value
		//..其余代码..//
	}
	//..其余代码..//
}
```



以下我们实现 API：isRef、unRef、proxyRefs。

isRef 即判断数据类型是否为 ref：

```ref.spec.ts
it('isRef', () => {
	const a = 1
    const ref_a = ref(a)
    const original = { foo: 1 }
    const ref_original = ref(original)

    expect(isRef(a)).toBe(false)
    expect(isRef(ref_a)).toBe(true)
    expect(isRef(original)).toBe(false)
    expect(isRef(ref_original)).toBe(true)
})
```

只需在 RefImpl 中加入一个标志即可，此处标志为 __v_isRef

```ref.ts
class RefImpl {
	//...其余代码...//
	public __v_isRef: boolean: true
}

function isRef(ref) {
	return !!ref.__v_isRef
}
```

<strong>注意这个属性是固定的，在时机使用vue3时，若以对象的某一属性键为 __v_isRef，且值为 true，则用此函数判断后返回结果为 true，即：</strong>

```index.vue
//..其余代码...//
import { isRef } from 'vue';
const fake_ref = {
	__v_isRef: true
}

console.log(isRef(fake_ref)) // true
//..其余代码...//
```

unRef 判断对象是否为 ref ，若是则返回 ref.value , 否则直接返回 ref，即：

```ref.spec.ts
 it('unRef', () => {
    const a = 1
    const ref_a = ref(a)
    expect(unRef(a)).toBe(1)
    expect(unRef(ref_a)).toBe(1)
  })
```

实现：

```ref.ts
export function unRef(ref) {
  return isRef(ref) ? ref.value : ref
}
```



当我们在实际使用时，若 ref 的 value 为一对象，其中一属性值仍为 ref 时，在使用中就需多次调用 .value，即：

```ts
const a = ref({
    age: ref(10)
})

const age = a.value.age.value
```

故希望减少 .value 的使用，即：

```ref.spec.ts
it('proxyRefs', () => {
    const user = {
      age: ref(10),
      name: '蛙叫你'
    }
    const proxyUser = proxyRefs(user)
    expect(user.age.value).toBe(10)
    expect(proxyUser.age).toBe(10)
    expect(proxyUser.name).toBe('蛙叫你')
    
    // 修改proxyUser的值，user也会变化
    proxyUser.age = 20
    expect(proxyUser.age).toBe(20)
    expect(user.age.value).toBe(20)

    proxyUser.age = ref(30)
    expect(proxyUser.age).toBe(30)
    expect(user.age.value).toBe(30)

  })
```

只需在访问属性时，进行判断是否为 ref 类型，若是则返回 .value 属性，在赋值时判断是否是将非 ref 的值赋给 ref 的值即可：

```ref.spec.ts
export function proxyRefs (ref) {
	return new Proxy(ref, {
		get(target, key) {
			return isRef(target[key]) ? target[key].value : target[key]
		}
		
		set(target, key, value) {
			if(isRef(target[key]) && !isRef(value)) {
				return target[key].value = value
			} else {
				return Reflect(target, key. value)
			}
		}
	})
}
```

整理代码如下：

```ref.ts
import { isObject } from '../shared'
import { trackEffect, triggerEffect } from './effect'
import { reactive } from './reactive'

class RefImpl {
  private _value: any
  private _rawValue: any
  public deps: Set<any>
  public __v_isRef: boolean = true
  constructor(value) {
    this._rawValue = value
    this._value = convert(this._rawValue)
    this.deps = new Set()
  }
  get value() {
    trackEffect(this.deps)
    return this._value
  }

  set value(newValue) {
    if (Object.is(newValue, this._rawValue)) return
    this._rawValue = newValue
    this._value = convert(newValue)
    triggerEffect(this.deps)
  }
}

function convert(value) {
  return isObject(value) ? reactive(value) : value
}

export function ref(value) {
  return new RefImpl(value)
}

export function isRef(ref) {
  return !!ref.__v_isRef
}

export function unRef(ref) {
  return isRef(ref)? ref.value: ref
}

export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get(target, key) {
      return unRef(Reflect.get(target, key))
    },
    set(target, key, value) {
      if (isRef(target[key]) && !isRef(value)) {
        return target[key].value = value
      } else {
        return Reflect.set(target, key, value)
      }
    }
  })
}


```



#### 计算属性 computed

computed 接受一有返回值的函数为参，返回的数据向外暴露 value 属性，compute 仅发生在 计算属性首次被访问时与依赖的变量值发生改变且再次访问时，即 lazily :

```computed.spec.ts
describe('computed', () => {
	it('happy path', () => {
		const user = reactive({
			age: 1
		})
		const age = computed(user)
		
		expect(age.value).toBe(1)
	})
	
	it('should compute lazily', () => {
		const value = reactive({
			foo: 1
		})
		const getter = jest.fn(() => {
			return value.foo
		})
		
		const cValue = computed(getter)
		
		expect(getter).not.toHaveBeenCalled()
		
		expect(cValue.value).toBe(1) // 此时首次访问计算属性的 value
		expect(getter).toHaveBeenCalledTimes(1)
		
		// 再次访问 cValue.value 时，依赖变量未发生改变，不 compute
		
		cValue.value
		
		expect(getter).toHaveBeenCalledTimes(1)
		
		value.foo = 2 
		// 依赖发生改变，为访问
		expect(getter).toHaveBeenCalledTimes(1)
		
		// 再次访问 cValue.value 且依赖发生改变， compute
		
		cValue.value
		expect(getter).toHaveBeenCalledTimes(2)
		
	})
})
```

同 ref ，创建一个类，暴露 value 的 get，value 即为接收函数 getter 的返回值：



```computed.ts
class ComputedImpl {
  private _getter: Function
  private _value: any

  constructor(getter) {
    this._getter = getter
  }

  get value() {
    return this._value = this._getter()
  }
}

export function computed(getter) {
  return new ComputedImpl(getter)
}
```

此时第一个测试已通过。



此时需要保证仅当依赖的变量发生改变且计算属性的 .value 被访问时，再次执行 getter，故需要一个变量在副作用函数执行时更改表示此时依赖的变量发生改变，在 get 时判断此标志，成功后运行 getter 并返回新值，即：

```computed.ts
import { ReactiveEffect } from './effect'

class ComputedImpl {
  private _getter: Function
  private _dirty: boolean = true
  private _value: any
  private _effect: ReactiveEffect
  constructor(getter: Function) {
    this._getter = getter
    this._effect = new ReactiveEffect(getter, {
      scheduler: () => {
        if (!this._dirty) {
          this._dirty = true
        }
      }
    })
  }
  get value() {
    if (this._dirty) {
      this._dirty = false
      this._value = this._effect.run()  
    }
    return this._value
  }
}

export function computed(getter) {
  return new ComputedImpl(getter)
}
```

# runtime-core

### 初始化 component 主流程

#### 组件的处理 handle component



#### 元素的处理  handle element

