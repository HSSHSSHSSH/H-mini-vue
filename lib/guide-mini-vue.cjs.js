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

function toDisplayString(value) {
    return String(value);
}

function isObject(value) {
    return typeof value === 'object' && value !== null;
}
function isString(value) {
    return typeof value === 'string';
}
// 将字符串首字母大写
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
// 将事件名转换为 on 开头的驼峰形式
function toHandlerKey(str) {
    return str ? 'on' + capitalize(str) : '';
}
// 将连字符形式转换为驼峰形式
function camelize(str) {
    return str.replace(/-(\w)/g, (_, c) => c ? c.toUpperCase() : '');
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
    let depsEffects = new Set(deps); // 避免无限调用
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
function isRef(ref) {
    return !!ref.__v_isRef;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
            }
            else {
                return Reflect.set(target, key, value);
            }
        }
    });
}

const queue$1 = new Set();
let isFlushing = false;
const p$1 = Promise.resolve();
function queueJob(job) {
    queue$1.add(job);
    if (!isFlushing) {
        isFlushing = true;
        p$1.then(() => {
            try {
                queue$1.forEach(job => job());
            }
            finally {
                queue$1.clear();
                isFlushing = false;
            }
        });
    }
}

// 组件实例，描述与组件有关的状态信息
let currentInstance$1 = null;
class CompInstance {
    constructor(vnode, state, props) {
        this.vnode = null; // 虚拟节点
        this.isMounted = false; // 是否挂载
        this.subTree = null; // 渲染内容
        this.props = null; // 组件的 props
        this.el = null; // 组件的 DOM 元素
        this.lifeCycle = {
            onBeforeMount: [],
            onMounted: [],
            onBeforeUpdate: [],
            onUpdated: [],
        };
        this.vnode = vnode;
        this.state = state;
        this.props = shallowReactive(props);
    }
}
function setCurrentInstance$1(instance) {
    currentInstance$1 = instance;
}
function lifeCycleRegister(fn, lifeCycle) {
    if (currentInstance$1) {
        currentInstance$1.lifeCycle[lifeCycle].push(fn);
    }
    else {
        console.error('onMounted 必须在 setup 函数中调用');
    }
}
function onBeforeMount(fn) {
    lifeCycleRegister(fn, 'onBeforeMount');
}
function onMounted(fn) {
    lifeCycleRegister(fn, 'onMounted');
}
function onBeforeUpdate(fn) {
    lifeCycleRegister(fn, 'onBeforeUpdate');
}
function onUpdated(fn) {
    lifeCycleRegister(fn, 'onUpdated');
}

// 挂载组件
function mountComponent(vnode, container, options, anchor) {
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
    console.log('更新组件');
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
        // instance.subTree = subTree
        // 将组件的 vnode 挂载到 container 上
        // 检查组件是否已被挂载
        if (!instance.isMounted) {
            // 调用 beforeMounted 钩子
            beforeMount && beforeMount.call(renderContext);
            instance.lifeCycle.onBeforeMount.forEach((fn) => fn.call(renderContext));
            patch(null, subTree, container, options);
            instance.isMounted = true;
            // 调用 mounted 钩子
            instance.lifeCycle.onMounted.forEach((fn) => fn.call(renderContext));
            mounted && mounted.call(renderContext);
        }
        else {
            console.log('组件更新');
            // 调用 beforeUpdate 钩子
            beforeUpdate && beforeUpdate();
            instance.lifeCycle.onBeforeUpdate.forEach((fn) => fn.call(renderContext));
            patch(instance.subTree, subTree, container, options);
            // 调用 updated 钩子
            updated && updated.call(renderContext);
            instance.lifeCycle.onUpdated.forEach((fn) => fn.call(renderContext));
        }
        instance.subTree = subTree;
        instance.el = subTree.el;
    }, { scheduler: queueJob });
}
/**
 *
 * @param options 组件传参的格式
 * @param propsData  实际传递的参数
 * @returns
 * 通过 options 与 propsData 解析 props, 分出合法 props 与非法 attrs
 */
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
    setCurrentInstance$1(instance);
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
    setCurrentInstance$1(null);
    return {
        render,
        setupState,
    };
}

function h_createRenderer(options) {
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
    console.log('tttype', type);
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
    console.log('更新元素');
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

const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
function createVNode(type, props = {}, children) {
    const vnode = {
        type,
        props,
        children,
        key: props && props.key,
        component: null,
        shapeFlag: getShapeFlag(type),
        el: null,
    };
    // 判断 children 类型
    if (typeof children === 'string') {
        vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    return vnode;
}
function createTextNode(text) {
    return createVNode(Text, {}, text);
}
function getShapeFlag(type) {
    return typeof type === 'string'
        ? 1 /* ShapeFlags.ELEMENT */
        : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    let children;
    if (name) {
        let slot = slots[name];
        if (slot) { // 具名插槽与插槽函数
            if (typeof slot === 'function') {
                children = slot(props);
                // return createVNode('Fragment', {}, slot(props))
            }
            else {
                children = slot;
                // return createVNode('Fragment', {}, slot)
            }
        }
    }
    else { // 单个插槽与多个插槽
        children = slots;
        // return createVNode('Fragment', {}, slots)
    }
    return createVNode(Fragment, {}, children);
}

function emit(instance, eventName, ...payload) {
    let event = toHandlerKey(camelize(eventName));
    let handler = instance.vnode.props[event];
    if (handler) {
        handler(...payload);
    }
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
    $props: (i) => i.props,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return instance.setupState[key];
        }
        else if (hasOwn(props, key)) {
            return instance.props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
    // set(target, key, value) {},
};
function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
}

function initSlots(instance, children) {
    // debugger
    if (typeof children === 'object' &&
        !Array.isArray(children) &&
        !children.hasOwnProperty('shapeFlag')) {
        // 具名插槽 插槽函数
        normalizeObjectSlots(instance, children);
    }
    else {
        // 单个节点 多个节点
        instance.slots = normalizeSlotValue(children);
    }
}
function normalizeObjectSlots(instance, children) {
    const slots = {};
    for (const key in children) {
        const value = children[key];
        slots[key] = typeof value === 'function' ? (props) => normalizeSlotValue(value(props)) : normalizeSlotValue(value);
    }
    instance.slots = slots;
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

let currentInstance = null;
function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        next: null,
        provides: parent && parent.provides ? parent.provides : {},
        parent,
        isMounted: false,
        subTree: {},
        emit: emit,
    };
    component.emit = emit.bind(null, component);
    return component;
}
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    const { setup } = Component;
    // ctx 组件访问代理对象
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    if (setup) {
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    if (typeof setupResult === 'object') {
        // 若 setupResult 是对象,则将此对象注入组件上下文中
        instance.setupState = proxyRefs(setupResult);
    }
    // 确保 render 函数合法
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (compiler && !Component.render) {
        if (Component.template) {
            console.log('蛙叫你');
            Component.render = compiler(Component.template);
        }
    }
    // if (Component.render) {
    instance.render = Component.render;
    // }
}
let compiler;
function registerRuntimeCompiler(_compiler) {
    compiler = _compiler;
}

/**
 *
 * @param key
 * @param val
 * 注入参数以供后代组件使用
 * 必须在 setup 函数中调用
 */
function provide(key, val) {
    console.log('provide调用', key, val);
    let currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        const parentProvides = currentInstance.parent.provides;
        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides); // 原型链指向父组件的 provide 避免污染 只执行一次
        }
        provides[key] = val;
    }
}
/**
 *
 * @param key
 * 取出父组件注入的参数
 * 必须在 setup 函数中使用
 */
function inject(key, defaultValue) {
    console.log('inject调用', key);
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const { parent } = currentInstance;
        const parentProvides = parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) { // 若父组件没有注入该参数，则使用默认值
            if (typeof defaultValue === 'function') {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

/**
 * 接受 DOM 元素作为参数，将 DOM 转化为 vnode, 之后所有的操作都针对与 vnode
 */
function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                const root_container = document.getElementById(rootContainer.slice(1));
                const vnode = createVNode(rootComponent);
                render(vnode, root_container);
            }
        };
    };
}

function shouldUpdateComponent(preVNode, nextVNode) {
    const { props: prevProps } = preVNode;
    const { props: nextProps } = nextVNode;
    for (const key in nextProps) {
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }
    return false;
}

const queue = [];
let isFlushPending = false;
const p = Promise.resolve();
function queueJobs(job) {
    if (!queue.includes(job)) {
        queue.push(job);
    }
    queueFlush();
}
function queueFlush() {
    if (isFlushPending)
        return;
    isFlushPending = true;
    nextTick(flushJobs);
}
function nextTick(fn) {
    return fn ? p.then(fn) : p;
}
function flushJobs() {
    isFlushPending = false;
    let job;
    while (job = queue.shift()) {
        job && job();
    }
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText, } = options;
    function render(vnode, container, parentComponent) {
        // 调用 patch
        patch(null, vnode, container, parentComponent, null);
    }
    // patch 处理虚拟节点
    function patch(n1, n2, container, parentComponent, anchor = null) {
        const { type, shapeFlag } = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent, anchor);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    // 处理组件 component
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
                else if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    // 处理元素 element
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                break;
        }
    }
    // 处理文本节点
    function processText(n1, n2, container) {
        const { children } = n2; // todo
        const textNode = (n2.el = document.createTextNode(children));
        container.appendChild(textNode);
    }
    /**
     * 处理 Fragment 节点
     * @param vnode
     * @param container
     * 对于 Fragment 节点，只需处理其 children 即可
     */
    function processFragment(n1, n2, container, parentComponent, anchor) {
        mountChildren(n2.children, container, parentComponent, anchor);
    }
    // 处理 element 节点
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            patchElement(n1, n2, parentComponent, anchor);
        }
    }
    // 更新 element 节点
    function patchElement(n1, n2, parentComponent, anchor) {
        const el = (n2.el = n1.el);
        // 更新 props
        patchProps(n1, n2, el);
        // 更新 children
        patchChildren(n1, n2, el, parentComponent, anchor);
    }
    // 更新 children
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const prevShapeFlag = n1.shapeFlag;
        const shapeFlag = n2.shapeFlag;
        const c1 = n1.children;
        const c2 = n2.children;
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            if (prevShapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                console.log('数组 -> 文本');
                // text -> array
                // 清空之前的 children
                unmountChildren(c1);
                // 设置 text
                hostSetElementText(container, c2);
            }
            if (c1 !== c2) {
                hostSetElementText(container, c2);
            }
        }
        else {
            if (prevShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                hostSetElementText(container, '');
                mountChildren(c2, container, parentComponent, anchor);
            }
            else {
                patchKeydChildren(c1, c2, container, parentComponent, anchor);
            }
        }
    }
    function patchKeydChildren(c1, c2, container, parentComponent, parentAnchor) {
        const l2 = c2.length;
        let i = 0;
        let e1 = c1.length - 1;
        let e2 = l2 - 1;
        function isSameType(n1, n2) {
            return n1.type === n2.type && n1.key === n2.key;
        }
        // 左侧
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSameType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            i++;
        }
        // 右侧
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSameType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        // 新的比老的多
        if (i > e1) {
            if (i <= e2) {
                const nextPos = e2 + 1;
                const anchor = nextPos < l2 ? c2[nextPos].el : null;
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent, anchor);
                    i++;
                }
            }
        }
        else if (i > e2) {
            // 老的比新的多
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        else {
            // 中间乱序部分
            let s1 = i;
            let s2 = i;
            const toBePatched = e2 - s2 + 1;
            let patched = 0;
            const keyToNewIndexMap = new Map();
            const newIndexToOldIndexMap = new Array(toBePatched).fill(0);
            let move = false;
            let maxNewIndexSoFar = 0;
            for (let i = s2; i <= e2; i++) {
                // 获取新节点的索引映射表
                const nextChild = c2[i];
                keyToNewIndexMap.set(nextChild.key, i);
            }
            for (let i = s1; i <= e1; i++) {
                // 旧节点在新节点中是否存在
                let newIndex;
                const prevChild = c1[i];
                if (patched >= toBePatched) {
                    // 剩余节点要被卸载
                    hostRemove(prevChild.el);
                    continue;
                }
                if (prevChild.key !== null) {
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    for (let j = s2; j <= e2; j++) {
                        if (isSameType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                if (newIndex === undefined) {
                    hostRemove(prevChild.el);
                }
                else {
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        move = true;
                    }
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    patch(prevChild, c2[newIndex], container, parentComponent, null);
                    patched++;
                }
            }
            const increasingNewIndexSequence = move
                ? getSequence(newIndexToOldIndexMap)
                : []; // 最长递增子序列
            let j = 0;
            for (let i = toBePatched; i >= 0; i--) {
                const nextIndex = i + s2;
                const nextChild = c2[nextIndex];
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                if (newIndexToOldIndexMap[i] === 0) {
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                else {
                    if (move) {
                        if (j < 0 || i !== increasingNewIndexSequence[j]) {
                            hostInsert(nextChild.el, container, anchor);
                        }
                        else {
                            j++;
                        }
                    }
                }
            }
        }
    }
    // 卸载 children
    function unmountChildren(children) {
        for (let i = 0; i < children.length; i++) {
            hostRemove(children[i]);
        }
    }
    // 更新 props
    const EMPTY_OBJ = {};
    function patchProps(n1, n2, el) {
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        if (oldProps !== newProps) {
            for (const key in newProps) {
                const prev = oldProps[key];
                const next = newProps[key];
                if (prev !== next) {
                    hostPatchProp(el, key, next);
                }
            }
            if (oldProps !== EMPTY_OBJ) {
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, null);
                    }
                }
            }
        }
    }
    // 挂载 element 节点
    function mountElement(vnode, container, parentComponent, anchor) {
        const el = (vnode.el = hostCreateElement(vnode.type));
        const { children, shapeFlag } = vnode;
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            mountChildren(vnode.children, el, parentComponent, anchor);
        }
        const { props } = vnode;
        if (props) {
            for (const key in props) {
                const val = props[key];
                hostPatchProp(el, key, val);
            }
        }
        hostInsert(el, container, anchor);
    }
    // children 是数组时，递归处理
    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach((v) => {
            patch(null, v, container, parentComponent, anchor);
        });
    }
    function processComponent(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountComponent(n2, container, parentComponent, anchor);
        }
        else {
            updateComponent(n1, n2);
        }
    }
    function updateComponent(n1, n2) {
        const instance = (n2.component = n1.component);
        if (shouldUpdateComponent(n1, n2)) {
            instance.next = n2;
            instance.update();
        }
        else {
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }
    function mountComponent(vnode, container, parentComponent, anchor) {
        const instance = (vnode.component = createComponentInstance(vnode, parentComponent));
        // 处理 setup 函数
        setupComponent(instance);
        // 渲染
        setupRenderEffect(instance, container, anchor);
    }
    function setupRenderEffect(instance, container, anchor) {
        instance.update = effect(() => {
            const { proxy } = instance;
            if (!instance.isMounted) {
                const subTree = (instance.subTree = instance.render.call(proxy, proxy));
                patch(null, subTree, container, instance, anchor);
                instance.vnode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                const { next, vnode } = instance;
                if (next) {
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                const subTree = instance.render.call(proxy, proxy);
                const prevSubTree = instance.subTree;
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance, anchor);
            }
        }, {
            scheduler() {
                queueJobs(instance.update);
            }
        });
    }
    return {
        createApp: createAppAPI(render),
    };
}
function updateComponentPreRender(instance, nextVNode) {
    instance.vnode = nextVNode;
    instance.next = null;
    instance.props = nextVNode.props;
}
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

// 源码里面这些接口是由 runtime-dom 来实现
// 这里先简单实现
// 后面也修改成和源码一样的实现
function createElement(type) {
    const element = document.createElement(type);
    return element;
}
function createText(text) {
    return document.createTextNode(text);
}
function setText(node, text) {
    node.nodeValue = text;
}
function setElementText(el, text) {
    el.textContent = text;
}
// function patchProp(el, key, preValue, nextValue) {
//   // preValue 之前的值
//   // 为了之后 update 做准备的值
//   // nextValue 当前的值
//   if (isOn(key)) {
//     // 添加事件处理函数的时候需要注意一下
//     // 1. 添加的和删除的必须是一个函数，不然的话 删除不掉
//     //    那么就需要把之前 add 的函数给存起来，后面删除的时候需要用到
//     // 2. nextValue 有可能是匿名函数，当对比发现不一样的时候也可以通过缓存的机制来避免注册多次
//     // 存储所有的事件函数
//     const invokers = el._vei || (el._vei = {});
//     const existingInvoker = invokers[key];
//     if (nextValue && existingInvoker) {
//       // patch
//       // 直接修改函数的值即可
//       existingInvoker.value = nextValue;
//     } else {
//       const eventName = key.slice(2).toLowerCase();
//       if (nextValue) {
//         const invoker = (invokers[key] = nextValue);
//         el.addEventListener(eventName, invoker);
//       } else {
//         el.removeEventListener(eventName, existingInvoker);
//         invokers[key] = undefined;
//       }
//     }
//   } else {
//     if (nextValue === null || nextValue === "") {
//       el.removeAttribute(key);
//     } else {
//       el.setAttribute(key, nextValue);
//     }
//   }
// }
function patchProp(el, key, nextVal) {
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, nextVal);
    }
    else {
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
function insert(child, parent, anchor = null) {
    parent.insertBefore(child, anchor);
}
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
let renderer;
function ensureRenderer() {
    // 如果 renderer 有值的话，那么以后都不会初始化了
    return (renderer ||
        (renderer = createRenderer({
            createElement,
            createText,
            setText,
            setElementText,
            patchProp,
            insert,
            remove,
        })));
}
const createApp = (...args) => {
    return ensureRenderer().createApp(...args);
};

var runtimeDom = /*#__PURE__*/Object.freeze({
    __proto__: null,
    get NodeFlags () { return exports.NodeFlags; },
    createApp: createApp,
    createElementVNode: createVNode,
    createRenderer: createRenderer,
    createTextNode: createTextNode,
    effect: effect,
    getCurrentInstance: getCurrentInstance,
    h: h,
    h_createRenderer: h_createRenderer,
    inject: inject,
    onBeforeMount: onBeforeMount,
    onBeforeUpdate: onBeforeUpdate,
    onMounted: onMounted,
    onUpdated: onUpdated,
    patch: patch,
    patchProp: patchProp,
    provide: provide,
    reactive: reactive,
    ref: ref,
    registerRuntimeCompiler: registerRuntimeCompiler,
    renderSlots: renderSlots,
    shallowReactive: shallowReactive,
    toDisplayString: toDisplayString
});

const TO_DISPLAY_STRING = Symbol(`toDisplayString`);
const CREATE_ELEMENT_VNODE = Symbol(`createElementVNode`);
const helperNameMap = {
    [TO_DISPLAY_STRING]: `toDisplayString`,
    [CREATE_ELEMENT_VNODE]: `createElementVNode`, // 对象的计算属性语法
};

function generate(ast) {
    const context = createCodegenContext();
    const { push } = context;
    genFunctionPreamble(ast, context);
    push('return ');
    const functionName = 'render';
    const args = ['_ctx', '_cache'];
    const signature = args.join(', ');
    push(`function ${functionName}(${signature}) {`);
    push('return ');
    genNode(ast.codegenNode, context);
    push('}');
    return {
        code: context.code,
    };
}
function genFunctionPreamble(ast, context) {
    const VueBinging = 'Vue';
    const { push } = context;
    const aliasHelper = (s) => `${helperNameMap[s]}: _${helperNameMap[s]}`;
    if (ast.helpers.length) {
        push(`const { ${ast.helpers.map(aliasHelper).join(', ')} } = ${VueBinging}`);
    }
    push('\n');
}
function genNode(node, context) {
    switch (node.type) {
        case 3 /* NodeTypes.TEXT */:
            genText(node, context);
            break;
        case 0 /* NodeTypes.INTERPOLATION */:
            genInterpolation(node, context);
            break;
        case 1 /* NodeTypes.SIMPLE_EXPRESSION */:
            genExpression(node, context);
            break;
        case 2 /* NodeTypes.ELEMENT */:
            genElement(node, context);
            break;
        case 5 /* NodeTypes.COMPOUND_EXPRESSION */:
            genCompoundExpression(node, context);
            break;
    }
}
function genCompoundExpression(node, context) {
    const { push } = context;
    const children = node.children;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (typeof child === 'string') {
            push(child);
        }
        else {
            genNode(child, context);
        }
    }
}
function genText(node, context) {
    const { push } = context;
    push(`'${node.content}'`);
}
function createCodegenContext() {
    const context = {
        code: '',
        push(source) {
            context.code += source;
        },
        helper(key) {
            return `_${helperNameMap[key]}`;
        },
    };
    return context;
}
function genInterpolation(node, context) {
    const { push, helper } = context;
    push(`${helper(TO_DISPLAY_STRING)}(`);
    genNode(node.content, context);
    push(`)`);
}
function genExpression(node, context) {
    const { push } = context;
    push(`${node.content}`);
}
function genElement(node, context) {
    const { push, helper } = context;
    const { tag, children, props } = node;
    push(`${helper(CREATE_ELEMENT_VNODE)}(`);
    genNodeList(genNullable([tag, props, children]), context);
    // genNode(children, context)
    push(')');
}
function genNullable(args) {
    return args.map((arg) => (arg ? arg : 'null'));
}
function genNodeList(nodes, context) {
    const { push } = context;
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        console.log(node);
        if (isString(node)) {
            push(node);
        }
        else {
            genNode(node, context);
        }
        if (i < nodes.length - 1) {
            push(', ');
        }
    }
}

function baseParse(content) {
    const context = createParserContext(content);
    return createRoot(parseChildren(context));
}
// 解析子节点
function parseChildren(context, ancestors = []) {
    const nodes = [];
    while (!isEnd(context, ancestors)) {
        let node;
        let s = context.source;
        if (s.startsWith('{{')) {
            node = parseInterpolation(context);
        }
        else if (s[0] === '<') {
            if (/[a-z]/i.test(s[1])) {
                node = parseElement(context, ancestors);
            }
        }
        if (!node) {
            // 默认为 text 类型
            node = parseText(context);
        }
        nodes.push(node);
    }
    return nodes;
}
function isEnd(context, ancestors) {
    const s = context.source;
    // 遇到结束标签
    // if (parentTag && s.startsWith(`</${parentTag}>`)) {
    //   return true
    // }
    if (s.startsWith('</')) {
        for (let i = ancestors.length - 1; i >= 0; i--) {
            const tag = ancestors[i].tag;
            if (startsWithEndTagOpen(s, tag)) {
                return true;
            }
        }
    }
    // source 为空时，表示已经解析完成
    return !s;
}
// 解析 text 文本
function parseText(context) {
    let endIndex = context.source.length;
    let endTokens = ['<', '{{'];
    for (let i = 0; i < endTokens.length; i++) {
        const index = context.source.indexOf(endTokens[i]);
        if (index !== -1 && endIndex > index) {
            endIndex = index;
        }
    }
    const content = parseTextData(context, endIndex);
    return {
        type: 3 /* NodeTypes.TEXT */,
        content: content,
    };
}
function parseTextData(context, length) {
    // 获取文本内容
    const content = context.source.slice(0, length);
    // 推进上下文
    advanceBy(context, length);
    return content;
}
// 解析 element
function parseElement(context, ancestors) {
    const element = parseTag(context, 0 /* TagType.Start */);
    ancestors === null || ancestors === void 0 ? void 0 : ancestors.push(element); // 收集开始标签
    element.children = parseChildren(context, ancestors);
    ancestors.pop(); // 移除开始标签
    if (startsWithEndTagOpen(context.source, element.tag)) {
        parseTag(context, 1 /* TagType.End */);
    }
    else {
        throw new Error(`缺少结束标签：${element.tag}`);
    }
    return element;
}
function startsWithEndTagOpen(source, tag) {
    return (source.startsWith('</') &&
        source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase());
}
// 解析 element 标签
function parseTag(context, type) {
    // 解析 tag
    const match = /^<\/?([a-z]*)/i.exec(context.source);
    const tag = match[1];
    // 删除处理完成的代码
    advanceBy(context, match[0].length);
    advanceBy(context, 1);
    if (type === 0 /* TagType.Start */) {
        return {
            type: 2 /* NodeTypes.ELEMENT */,
            tag: tag,
        };
    }
}
// 解析插值表达式
function parseInterpolation(context) {
    const openDelimiter = '{{';
    const closeDelimiter = '}}';
    const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length);
    advanceBy(context, openDelimiter.length);
    const rawContextLength = closeIndex - openDelimiter.length;
    let content = parseTextData(context, rawContextLength);
    content = content.trim();
    advanceBy(context, closeDelimiter.length);
    return {
        type: 0 /* NodeTypes.INTERPOLATION */,
        content: {
            type: 1 /* NodeTypes.SIMPLE_EXPRESSION */,
            content: content,
        },
    };
}
// 从上下文中移除已解析的内容
function advanceBy(context, length) {
    context.source = context.source.slice(length);
}
// 创建解析上下文
function createParserContext(content) {
    return {
        source: content,
    };
}
// 创建根节点
function createRoot(children) {
    return {
        children,
        type: 4 /* NodeTypes.ROOT */,
    };
}

function transform(root, options = {}) {
    let context = createTransformContext(root, options);
    // 遍历 ast，找到所有的文本类型的节点
    // 修改文本节点的 content
    traverseNode(root, context);
    createRootCodegen(root);
    root.helpers = [...context.helpers.keys()];
}
// 遍历 ast
function traverseNode(node, context) {
    let nodeTransforms = context.nodeTransforms;
    const exitFns = [];
    for (let i = 0; i < nodeTransforms.length; i++) {
        const transform = nodeTransforms[i];
        let onExit = transform(node, context);
        if (onExit) {
            exitFns.push(onExit);
        }
    }
    switch (node.type) {
        case 0 /* NodeTypes.INTERPOLATION */:
            context.helper(TO_DISPLAY_STRING);
            break;
        case 2 /* NodeTypes.ELEMENT */:
        case 4 /* NodeTypes.ROOT */:
            traverseChildren(node, context);
            break;
    }
    let i = exitFns.length;
    while (i--) {
        exitFns[i]();
    }
}
// 处理 children
function traverseChildren(node, context) {
    let children = node.children;
    for (let i = 0; i < children.length; i++) {
        let child = children[i];
        traverseNode(child, context); // 深度优先遍历
    }
}
// 创建 transform 上下文
function createTransformContext(root, options) {
    const context = {
        root,
        nodeTransforms: options.nodeTransforms || [],
        helpers: new Map(),
        helper(key) {
            context.helpers.set(key, true);
        },
    };
    return context;
}
function createRootCodegen(root) {
    const child = root.children[0];
    if (child.type === 2 /* NodeTypes.ELEMENT */) {
        root.codegenNode = child.codegenNode;
    }
    else {
        root.codegenNode = child;
    }
}

function createVNodeCall(context, tag, props, children) {
    context.helper(CREATE_ELEMENT_VNODE);
    return {
        type: 2 /* NodeTypes.ELEMENT */,
        tag,
        props,
        children,
    };
}

function transformElement(node, context) {
    if (node.type === 2 /* NodeTypes.ELEMENT */) {
        return () => {
            // tag
            const vnodeTag = `"${node.tag}"`;
            // props
            let vnodeProps;
            //children
            let children = node.children;
            let vnodeChildren = children[0];
            children[0];
            node.codegenNode = createVNodeCall(context, vnodeTag, vnodeProps, vnodeChildren);
        };
    }
}

function transformExpression(node) {
    if (node.type === 0 /* NodeTypes.INTERPOLATION */) {
        // const rawContext = node.content.content
        // node.content.content = `_ctx.${rawContext}`
        node.content = processExpression(node.content);
    }
}
function processExpression(node) {
    node.content = `_ctx.${node.content}`;
    return node;
}

function isText(node) {
    return node.type === 3 /* NodeTypes.TEXT */ || node.type === 0 /* NodeTypes.INTERPOLATION */;
}

function transformText(node) {
    if (node.type === 2 /* NodeTypes.ELEMENT */) {
        // 复合类型的收集
        return () => {
            const { children } = node;
            let currentContainer;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (isText(child)) {
                    for (let j = i + 1; j < children.length; j++) {
                        const next = children[j];
                        if (isText(next)) {
                            if (!currentContainer) {
                                currentContainer = children[i] = {
                                    type: 5 /* NodeTypes.COMPOUND_EXPRESSION */,
                                    children: [child],
                                };
                            }
                            currentContainer.children.push(` + `);
                            currentContainer.children.push(next);
                            children.splice(j, 1);
                            j--;
                        }
                        else {
                            currentContainer = null;
                            break;
                        }
                    }
                }
            }
        };
    }
}

function baseCompile(template) {
    const ast = baseParse(template);
    transform(ast, {
        nodeTransforms: [transformExpression, transformElement, transformText]
    });
    return generate(ast);
}

// mini-vue的出口
function compileToFunction(template) {
    const { code } = baseCompile(template);
    const render = new Function("Vue", code)(runtimeDom);
    return render;
    // function renderFunction(Vue) {
    //   const {
    //     toDisplayString: _toDisplayString,
    //     openBlock: _openBlock,
    //     createElementBlock: _createElementBlock,
    //   } = Vue
    //   function render(_ctx, _cache) {
    //     return (
    //       _openBlock(),
    //       _createElementBlock(
    //         'div',
    //         null,
    //         'hi, ' + _toDisplayString(_ctx.message),
    //       )
    //     )
    //   }
    // }
}
registerRuntimeCompiler(compileToFunction);

exports.createApp = createApp;
exports.createElementVNode = createVNode;
exports.createRenderer = createRenderer;
exports.createTextNode = createTextNode;
exports.effect = effect;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.h_createRenderer = h_createRenderer;
exports.inject = inject;
exports.onBeforeMount = onBeforeMount;
exports.onBeforeUpdate = onBeforeUpdate;
exports.onMounted = onMounted;
exports.onUpdated = onUpdated;
exports.patch = patch;
exports.patchProp = patchProp;
exports.provide = provide;
exports.reactive = reactive;
exports.ref = ref;
exports.registerRuntimeCompiler = registerRuntimeCompiler;
exports.renderSlots = renderSlots;
exports.shallowReactive = shallowReactive;
exports.toDisplayString = toDisplayString;
