'use strict';

exports.NodeFlags = void 0;
(function (NodeFlags) {
    NodeFlags[NodeFlags["Text"] = 0] = "Text";
    NodeFlags[NodeFlags["Comment"] = 1] = "Comment";
    NodeFlags[NodeFlags["Fragment"] = 2] = "Fragment";
})(exports.NodeFlags || (exports.NodeFlags = {}));

// 快速 diff
function fast_diff(n1, n2, el, options) {
    const { insert, unmount } = options;
    let oldChildren = n1.children;
    let newChildren = n2.children;
    // 从前向后比较
    let j = 0;
    let oldVNode = oldChildren[j];
    let newVNode = newChildren[j];
    while (oldVNode.key === newVNode.key) {
        //预处理
        /**
         * 打补丁
         * 更新索引，更新 oldVNode, newVNode
         */
        patch(oldVNode, newVNode, el, options);
        j++;
        oldVNode = oldChildren[j] || {};
        newVNode = newChildren[j] || {};
    }
    // 从后向前比较
    let oldEnd = oldChildren.length - 1;
    let newEnd = newChildren.length - 1;
    oldVNode = oldChildren[oldEnd];
    newVNode = newChildren[newEnd];
    while (oldVNode.key === newVNode.key) {
        //预处理
        /**
         * 打补丁
         * 更新索引，更新 oldVNode, newVNode
         */
        patch(oldVNode, newVNode, el, options);
        oldEnd--;
        newEnd--;
        oldVNode = oldChildren[oldEnd] || {};
        newVNode = newChildren[newEnd] || {};
    }
    // 判断是否有需要新增与卸载的节点
    if (j <= newEnd && j > oldEnd) {
        // 仅有新增节点
        for (let i = j; i <= newEnd; i++) {
            // 新增节点
            let anchor = newChildren[newEnd + 1] ? newChildren[newEnd + 1].el : null;
            patch(null, newChildren[i], el, options, anchor);
        }
    }
    else if (j > newEnd && j <= oldEnd) {
        // 仅有卸载节点
        for (let i = j; i <= oldEnd; i++) {
            // 卸载节点
            unmount(oldChildren[i]);
        }
    }
    else {
        // 非理想情况
        let count = newEnd - j + 1; // 新节点数组中未处理的节点数量
        let source = new Array(count).fill(-1); // 用于存放新节点对应旧节点的索引
        let oldStart = j;
        let newStart = j;
        let keyIndex = {}; // newNodeKey: newNodeIndex
        let move = false; // 是否需要移动
        let lastIndex = 0; // 在遍历遍历旧节点时遇到的最大索引值
        let patched = 0; // 已处理的新节点的数量
        for (let i = newStart; i <= newEnd; i++) {
            keyIndex[newChildren[i].key] = i;
        }
        // 更新 source 数组
        for (let i = oldStart; i <= oldEnd; i++) {
            let oldVNode = oldChildren[i];
            if (patched <= count) { // 当已处理的节点数量小于未处理的节点数量时，继续处理
                /**
                 * idx是旧节点在未处理新节点数组中的索引
                 */
                let idx = keyIndex[oldChildren[i].key];
                if (idx === undefined) {
                    // 旧节点在新节点中不存在
                    unmount(oldChildren[i]);
                }
                else {
                    // 旧节点在新节点中存在
                    /**
                     * 打补丁
                     * 填充source
                     */
                    patch(oldVNode, newChildren[idx], el, options);
                    patched++;
                    source[idx - newStart] = i;
                    // 判断节点是否需要移动
                    if (idx < lastIndex) {
                        move = true;
                    }
                    else {
                        lastIndex = idx;
                    }
                }
            }
            else {
                unmount(oldChildren[i]);
            }
        }
        if (move || patched < newEnd - 1) { // 需要执行移动的操作
            /**
             * 1. 找到需要移动的元素
             * 2. 移动到正确的位置
             */
            let seq = lis(source);
            let s = seq.length - 1; // 最长递增子序列的最后一个索引
            let i = source.length - 1; // 未处理的新节点数组的最后一个索引
            for (i; i >= 0; i--) { // 遍历未处理的新节点数组
                if (source[i] === -1) { // 未处理的新节点数组中的节点在旧节点数组中不存在
                    let pos = i + newStart; // 新节点在新节点数组中的索引
                    let nextPos = pos + 1; // 新节点在新节点数组中的下一个索引
                    let anchor = nextPos < newChildren.length ? newChildren[nextPos].el : null; // 新节点在新节点数组中的下一个节点
                    patch(null, newChildren[pos], el, options, anchor); // 新增节点
                }
                else if (i !== seq[s]) {
                    // 需要移动
                    let pos = i + newStart; // 新节点在新节点数组中的索引
                    let nextPos = pos + 1; // 新节点在新节点数组中的下一个索引
                    let anchor = nextPos < newChildren.length ? newChildren[nextPos].el : null; // 新节点在新节点数组中的下一个节点
                    insert(newChildren[pos].el, el, anchor); // 移动节点
                }
                else {
                    // 不需要移动
                    s--;
                }
            }
        }
    }
}
// 计算最长递增子序列
function lis(arr) {
    let len = arr.length;
    let result = [0];
    let p = arr.slice(0);
    let start;
    let end;
    let middle;
    for (let i = 0; i < len; i++) {
        let arrI = arr[i];
        if (arrI !== 0) {
            let resultLastIndex = result[result.length - 1];
            if (arr[resultLastIndex] < arrI) {
                p[i] = resultLastIndex;
                result.push(i);
                continue;
            }
            start = 0;
            end = result.length - 1;
            while (start < end) {
                middle = ((start + end) / 2) | 0;
                if (arr[result[middle]] < arrI) {
                    start = middle + 1;
                }
                else {
                    end = middle;
                }
            }
            if (arrI < arr[result[start]]) {
                if (start > 0) {
                    p[i] = result[start - 1];
                }
                result[start] = i;
            }
        }
    }
    start = result.length;
    end = result[start - 1];
    while (start-- > 0) {
        result[start] = end;
        end = p[end];
    }
    return result;
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
const shallowReactiveGet = createGetter(false, true);
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
const shallowReactiveHandlers = {
    get: shallowReactiveGet,
    set
};
const shallowReadonlyHandlers = Object.assign({}, readonlyHandlers, { get: shallowReadonlyGet });

function createActiveObject(raw, baseHandlers) {
    return new Proxy(raw, baseHandlers);
}
function reactive(raw) {
    return createActiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createActiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createActiveObject(raw, shallowReadonlyHandlers);
}
function shallowReactive(raw) {
    return createActiveObject(raw, shallowReactiveHandlers);
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

const queue = new Set();
let isFlushing = false;
const p = Promise.resolve();
function queueJob(job) {
    queue.add(job);
    if (!isFlushing) {
        isFlushing = true;
        p.then(() => {
            try {
                queue.forEach(job => job());
            }
            finally {
                queue.clear();
                isFlushing = false;
            }
        });
    }
}

// 组件实例，描述与组件有关的状态信息
class CompInstance {
    constructor(vnode, state, props) {
        this.vnode = null; // 虚拟节点
        this.isMounted = false; // 是否挂载
        this.subTree = null; // 渲染内容
        this.props = null; // 组件的 props
        this.vnode = vnode;
        this.state = state;
        this.props = shallowReactive(props);
    }
}

// 挂载组件
function mountComponent(vnode, container, options, anchor) {
    console.log('挂载 租价', vnode);
    // 通过 vnode.type 获取组件的描述对象
    const componentOptions = vnode.type;
    // 获取描述对象的 render 函数与内部状态
    let { render, data, props: propsOptions, setup, beforeCreate, created, beforeMount, mounted, beforeUpdate, updated, } = componentOptions;
    // 调用 beforeCreate 钩子
    beforeCreate && beforeCreate();
    const state = data ? reactive(data()) : null;
    // 解析组件 props
    const [props, attrs] = resolveProps(propsOptions, vnode.props);
    const instance = new CompInstance(vnode, state, props);
    const emit = createEmit(instance);
    let { render: new_render, setupState } = handleSetup(setup, render, instance, attrs, emit);
    if (!setupState) {
        render = new_render;
    }
    vnode.component = instance;
    const renderContext = createRenderContext(instance, setupState);
    // 调用 created 钩子
    created && created.call(renderContext);
    // 调用 render 函数，返回组件的 vnode
    // 组件内部状态更新时，更新视图
    reactiveRender(
    // 注册渲染函数
    render, renderContext, instance, container, options, beforeMount, mounted, beforeUpdate, updated);
}
// 更新组件
function patchComponent(n1, n2, options, anchor) {
    const instance = (n2.component = n1.component);
    // 获取当前 props 数据
    const props = instance.props;
    updateProps(n1, n2, props);
}
/**
 *
 * @param event
 * @param payload
 * 注册事件处理函数
 * 将事件名称前加 on 并大写首字母，作为事件处理函数的名称，在 props 上查找对丁的事件处理函数
 */
function createEmit(instance) {
    return function emit(event, ...payload) {
        const eventName = `on${event[0].toUpperCase()}${event.slice(1)}`;
        let handler = instance.props[eventName];
        if (handler) {
            handler(...payload);
        }
        else {
            console.log('事件不存在');
        }
    };
}
// 注册副作用函数
function reactiveRender(render, renderContext, instance, container, options, beforeMount = null, mounted = null, beforeUpdate = null, updated = null) {
    effect(() => {
        const subTree = render.call(renderContext, renderContext); // 设置 this 的指向
        instance.subTree = subTree;
        // 将组件的 vnode 挂载到 container 上
        // 检查组件是否已被挂载
        if (!instance.isMounted) {
            // 调用 beforeMounted 钩子
            beforeMount && beforeMount.call(renderContext);
            patch(null, subTree, container, options);
            instance.isMounted = true;
            // 调用 mounted 钩子
            mounted && mounted.call(renderContext);
        }
        else {
            // 调用 beforeUpdate 钩子
            beforeUpdate && beforeUpdate();
            patch(instance.subTree, subTree, container, options);
            // 调用 updated 钩子
            updated && updated.call(renderContext);
        }
        instance.subTree = subTree;
    }, { scheduler: queueJob });
}
// 解析组件传参
function resolveProps(options = {}, propsData = {}) {
    const props = {};
    const attrs = {};
    for (const key in propsData) {
        if (key in options || key.startsWith('on')) { // 事件名称以 on 开头， 虽未在 props 中显式声明，也视为合法
            // 若为组件传递的 props 在组件描述对象中存在，则视为合法的 props
            props[key] = propsData[key];
        }
        else {
            // 若为组件传递的 props 在组件描述对象中不存在，则视为非法的 props
            attrs[key] = propsData[key];
        }
    }
    return [props, attrs];
}
// 检测 props 是否发生变化
function hasPropsChanged(prevProps, nextProps) {
    const nextKeys = Object.keys(nextProps);
    if (nextKeys.length !== Object.keys(prevProps).length) {
        return true;
    }
    for (let i = 0; i < nextKeys.length; i++) {
        const key = nextKeys[i];
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }
    return false;
}
// 更新 props
function updateProps(n1, n2, props) {
    // 检测 props 是否发生变化
    if (hasPropsChanged(n1.props, n2.props)) {
        // 若 props 发生变化，则更新 props
        const [nextProps] = resolveProps(n2.type, n2.props);
        // 更新 props
        for (const key in nextProps) {
            props[key] = nextProps[key];
        }
        // 删除不存在的 props
        for (const key in n1.props) {
            if (!(key in nextProps)) {
                delete props[key];
            }
        }
    }
}
/**
 *
 * @param instance
 * @returns
 * 创建渲染上下文
 * 在对数据进行读取操作时，首先会在 state 中查找，若 state 中不存在，则会在 props 中查找
 */
//q: 为什么不直接使用 instance 作为上下文
function createRenderContext(instance, setupState = null) {
    return new Proxy(instance, {
        get(target, key) {
            const { state, props } = target;
            if (state && key in state) { // 添加是否存在的判断  以下同理
                return state[key];
            }
            else if (props && key in props) {
                return props[key];
            }
            else if (setupState && key in setupState) {
                // 增加对 setupState 的支持
                return setupState[key];
            }
            else {
                return undefined;
            }
        },
        set(target, key, value) {
            const { state, props } = target;
            if (state && key in state) {
                state[key] = value;
            }
            else if (props && key in props) {
                props[key] = value;
            }
            else if (setupState && key in setupState) {
                // 增加对 setupState 的支持
                setupState[key] = value;
            }
            else {
                console.warn('设置的属性不存在');
            }
            return true;
        },
    });
}
// 处理 setup 函数
function handleSetup(setup, render, instance, attrs, emit) {
    console.log('在这里处理 setup 函数', attrs);
    let setupState = null;
    if (setup) {
        const setupContext = { attrs, emit };
        const setupResult = setup(shallowReadonly(instance.props), setupContext);
        // 处理 setup 返回值
        if (typeof setupResult === 'function') {
            // 返回值为一函数
            // 判断渲染函数是否冲突
            if (render) {
                console.warn('setup 函数返回值与 render 函数冲突');
            }
            render = setupResult;
        }
        else {
            // 返回值为一对象
            setupState = setupResult;
        }
    }
    return {
        render,
        setupState,
    };
}

function createRenderer(options) {
    const { unmount } = options;
    function render(vnode, container) {
        if (vnode) {
            // 若 vnode 存在，则调用 patch
            patch(container._vnode, vnode, container, options);
        }
        else {
            if (container._vnode) {
                // 若旧的 vnode 存在，则卸载
                unmount(container._vnode);
            }
        }
        // 将本次 vnode 存储，作为下次的旧 vnode
        container._vnode = vnode;
    }
    return render;
}
function patch(n1, n2, container, options, anchor = null) {
    const { createText, createComment, setNodeValue, insert } = options;
    const { type } = n2;
    if (typeof type === 'string') {
        if (!n1) {
            // 旧的 vnode 不存在，直接挂载
            mountElement(n2, container, options, anchor);
        }
        else {
            patchElement(n1, n2, options);
        }
    }
    else if (typeof type === 'object') {
        // 组件
        console.log('蛙叫你  组件');
        if (!n1) {
            mountComponent(n2, container, options);
        }
        else {
            patchComponent(n1, n2);
        }
    }
    else if (type === exports.NodeFlags.Text) {
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
    else if (type === exports.NodeFlags.Comment) {
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
    else if (type === exports.NodeFlags.Fragment) {
        // Fragment 节点
        // 对于 Fragment 节点，其实就是一个数组，只需处理其 children，所以直接遍历 children
        if (!n1) {
            n2.children.forEach((child) => {
                patch(null, child, container, options);
            });
        }
        else {
            patchChildren(n1, n2, container, options);
        }
    }
    else ;
}
// 挂载元素
function mountElement(vnode, container, options, anchor) {
    const { createElement, setElementText, insert, patchProps } = options;
    // 创建 DOM 元素
    const el = (vnode.el = createElement(vnode.type)); // 将 el 挂载到 vnode 上
    // 若children 是字符串，则为文本类型
    if (typeof vnode.children === 'string') {
        setElementText(el, vnode.children);
    }
    else if (Array.isArray(vnode.children)) {
        vnode.children.forEach((child) => {
            patch(null, child, el, options);
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
    insert(el, container, anchor);
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
            //  easy_diff(n1, n2, el, options)
            // double_end_diff(n1, n2, el, options)
            fast_diff(n1, n2, el, options);
        }
        else {
            // 情况 2, 5
            setElementText(el, '');
            n2.children.forEach((child) => {
                patch(null, child, el, options);
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

exports.createRenderer = createRenderer;
exports.effect = effect;
exports.patch = patch;
exports.reactive = reactive;
exports.ref = ref;
exports.shallowReactive = shallowReactive;
