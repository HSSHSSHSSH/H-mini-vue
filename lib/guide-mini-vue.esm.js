var NodeFlags;
(function (NodeFlags) {
    NodeFlags[NodeFlags["Text"] = 0] = "Text";
    NodeFlags[NodeFlags["Comment"] = 1] = "Comment";
    NodeFlags[NodeFlags["Fragment"] = 2] = "Fragment";
})(NodeFlags || (NodeFlags = {}));

function createRenderer(options) {
    const { unmount } = options;
    function render(vnode, container) {
        if (vnode) {
            // 若 vnode 存在，则调用 patch
            path(container._vnode, vnode, container, options);
        }
        else {
            if (container._vnode) {
                // 若旧的 vnode 存在，则卸载
                // container.innerHTML = ''
                unmount(container._vnode);
            }
        }
        // 将本次 vnode 存储，作为下次的旧 vnode
        container._vnode = vnode;
    }
    return render;
}
function path(n1, n2, container, options) {
    // const {unmount} = options // ??????
    // if (n1 && n1.type !==n2.type) { // ??????
    //   unmount(n1)
    //   n1 = null
    // } // ???
    const { createText, createComment, setNodeValue, insert } = options;
    const { type } = n2;
    if (typeof type === 'string') {
        if (!n1) {
            // 旧的 vnode 不存在，直接挂载
            mountElement(n2, container, options);
        }
        else {
            patchElement(n1, n2, options);
        }
    }
    else if (typeof type === 'object') ;
    else if (type === NodeFlags.Text) {
        // 文本节点
        if (!n1) {
            // 旧节点不存在 创建
            const el = (n2.el = createText(n2.children));
            insert(el, container);
        }
        else {
            // 旧节点存在 更新
            const el = (n2.el = n1.el);
            if (n2.children !== n1.children) {
                setNodeValue(el, n2.children);
            }
        }
    }
    else if (type === NodeFlags.Comment) {
        // 注释节点
        if (!n1) {
            // 旧节点不存在 创建
            const el = (n2.el = createComment(n2.children));
            insert(el, container);
        }
        else {
            // 旧节点存在 更新
            const el = (n2.el = n1.el);
            if (n2.children !== n1.children) {
                setNodeValue(el, n2.children);
            }
        }
    }
    else if (type === NodeFlags.Fragment) {
        // Fragment 节点
        // 对于 Fragment 节点，其实就是一个数组，只需处理其 children，所以直接遍历 children
        if (!n1) {
            n2.children.forEach((child) => {
                path(null, child, container, options);
            });
        }
        else {
            patchChildren(n1, n2, container, options);
        }
    }
    else ;
}
// 挂载元素
function mountElement(vnode, container, options) {
    const { createElement, setElementText, insert, patchProps } = options;
    // 创建 DOM 元素
    const el = (vnode.el = createElement(vnode.type)); // 将 el 挂载到 vnode 上
    // 若children 是字符串，则为文本类型
    if (typeof vnode.children === 'string') {
        setElementText(el, vnode.children);
    }
    else if (Array.isArray(vnode.children)) {
        vnode.children.forEach((child) => {
            path(null, child, el, options);
        });
    }
    // 设置属性
    if (vnode.props) {
        for (let key in vnode.props) {
            /**
             * 在设置属性时，优先设置元素的 DOM properties
             */
            patchProps(el, key, null, vnode.props[key]);
        }
    }
    // 将 DOM 元素挂载到容器上
    insert(el, container);
}
// 更新元素
function patchElement(n1, n2, options) {
    let { patchProps } = options;
    const el = (n2.el = n1.el);
    // 比较 props
    const oldProps = n1.props || {};
    const newProps = n2.props || {};
    for (let key in newProps) {
        if (newProps[key] !== oldProps[key]) {
            patchProps(el, key, oldProps[key], newProps[key]);
        }
    }
    for (let key in oldProps) {
        if (!(key in newProps)) {
            patchProps(el, key, oldProps[key], null);
        }
    }
    // 比较 children
    patchChildren(n1, n2, el, options);
}
// 更新 children
function patchChildren(n1, n2, el, options) {
    const { setElementText, unmount } = options;
    /**
     * 此时旧 vnode 的 children 可能是 文本，一组子节点, 没有子节点
     * 新的 vnode 的 children 可能是 文本，一组子节点, 没有子节点
     * 有 9 中情况
     * 1. 文本 -> 文本
     * 2. 文本 -> 一组子节点
     * 3. 文本 -> 没有子节点
     * 4. 一组子节点 -> 文本
     * 5. 一组子节点 -> 一组子节点
     * 6. 一组子节点 -> 没有子节点
     * 7. 没有子节点 -> 文本
     * 8. 没有子节点 -> 一组子节点
     * 9. 没有子节点 -> 没有子节点
     */
    if (typeof n2.children === 'string') {
        // 情况 1, 4, 7
        if (Array.isArray(n1.children)) {
            n1.children.forEach((child) => {
                unmount(child);
            });
        }
        setElementText(el, n2.children);
    }
    else if (Array.isArray(n2.children)) {
        // 情况 2, 5, 8
        if (Array.isArray(n1.children)) {
            // 情况5
            // 核心 diff 算法
            // 将旧子节点全部卸载
            n1.children.forEach((c) => unmount(c));
            // 将新子节点全部挂载
            n2.children.forEach((c) => path(null, c, el, options));
        }
        else {
            // 情况 2, 5
            setElementText(el, '');
            n2.children.forEach((child) => {
                path(null, child, el, options);
            });
        }
    }
    else {
        // 情况 3, 6, 9
        if (Array.isArray(n1.children)) {
            // 情况6
            n1.children.forEach((child) => {
                unmount(child);
            });
        }
        else if (typeof n1.children === 'string') {
            // 情况 3
            setElementText(el, '');
        }
        // 情况 9， 什么都不做
    }
}

function isObject(value) {
    return typeof value === 'object' && value !== null;
}

let activeEffect; // 当前活跃的 ReactiveEffect 实例
let effectStack = []; // 用于存储副作用函数的栈
let targetMap = new WeakMap(); // 用于存储依赖项的 Map
class ReactiveEffect {
    constructor(fn, options) {
        this.active = true;
        this._fn = fn;
        this.deps = new Set(); // 所有与该副作用函数相关的依赖项
        this.options = options;
    }
    run() {
        let res;
        activeEffect = this;
        // 将 activeEffect 放入 effectStack 的首位
        effectStack.push(this);
        cleanup(this); // 清除与该副作用函数相关的依赖项
        res = this._fn(); // 有收集依赖的操作
        // 将 activeEffect 从 effectStack 中移除
        effectStack.pop();
        activeEffect = effectStack[effectStack.length - 1]; // 维护此变量用于仅在注册副作用函数阶段进行 track 操作
        return res;
    }
    stop() {
        if (this.active) {
            if (this.options && this.options.onStop) {
                this.options.onStop();
            }
            cleanup(this);
            this.active = false;
        }
    }
}
// 收集依赖
// q: 为什么targetMap要用WeakMap
// a: 因为WeakMap的key是弱引用，当key被回收时，value也会被回收, 这样就不会造成内存泄漏.
function track(target, key) {
    if (!activeEffect)
        return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map()));
    }
    let deps = depsMap.get(key);
    if (!deps) {
        depsMap.set(key, (deps = new Set()));
    }
    trackEffect(deps);
}
function trackEffect(deps) {
    if (!activeEffect)
        return;
    deps.add(activeEffect);
    if (!activeEffect.deps) {
        activeEffect.deps = new Set();
    }
    activeEffect.deps.add(deps);
}
// 触发依赖
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    if (!depsMap)
        return;
    let deps = depsMap.get(key);
    if (!deps)
        return;
    triggerEffect(deps);
}
function triggerEffect(deps) {
    let depsEffects = new Set(deps);
    depsEffects.forEach((effect) => {
        if (effect.options && effect.options.scheduler) {
            // 如果有配置scheduler，则执行scheduler
            effect.options.scheduler(effect.run.bind(effect));
        }
        else {
            effect.run();
        }
    });
}
function effect(fn, options = {}) {
    // 注册副作用函数
    const _effect = new ReactiveEffect(fn, options);
    if (!options.lazy) {
        _effect.run();
    }
    const runner = _effect.run.bind(_effect);
    runner.stop = _effect.stop.bind(_effect);
    return runner;
}
function cleanup(reactiveEffect) {
    const { deps } = reactiveEffect;
    if (deps) {
        deps.forEach((dep) => {
            dep.delete(reactiveEffect);
        });
    }
    reactiveEffect.deps.clear();
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, isShallow = false) {
    return function get(target, key) {
        if (key === "__v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly" /* ReactiveFlags.IS_READONLY */) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        if (!isReadonly) {
            // 依赖收集
            track(target, key);
        }
        if (isShallow) {
            return res;
        }
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        let res = Reflect.set(target, key, value);
        // 触发依赖
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = {
    get,
    set
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn('只读属性，虾吗？');
        return true;
    }
};
Object.assign({}, readonlyHandlers, { get: shallowReadonlyGet });

function createActiveObject(raw, baseHandlers) {
    return new Proxy(raw, baseHandlers);
}
function reactive(raw) {
    return createActiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createActiveObject(raw, readonlyHandlers);
}

class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
        this._rawValue = value;
        this._value = convert(this._rawValue);
        this.deps = new Set();
    }
    get value() {
        trackEffect(this.deps);
        return this._value;
    }
    set value(newValue) {
        if (Object.is(newValue, this._rawValue))
            return;
        this._rawValue = newValue;
        this._value = convert(newValue);
        triggerEffect(this.deps);
    }
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function ref(value) {
    return new RefImpl(value);
}

export { NodeFlags, createRenderer, effect, reactive, ref };
