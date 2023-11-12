

export function createRenderer(options) {
  function render(vnode, container) {
    if(vnode) {
      // 若 vnode 存在，则调用 patch
      path(container._vode, vnode, container, options)
    } else {
      if(container._vnode) { // 若旧的 vnode 存在，则卸载
        container.innerHTML = ''
      } 
    }
    // 将本次 vnode 存储，作为下次的旧 vnode
    container._vnode = vnode
  }
  return render
}

function path(n1, n2, container, options) {
  if (!n1) {  // 旧的 vnode 不存在，直接挂载
     mountElement(n2, container, options)
  } else {
    // 旧的 vnode 存在，进行打补丁操作
  }
}

// 挂载元素
function mountElement(vnode, container, options) {
  const {
    createElement,
    setElementText,
    insert,
    patchProps
  } = options
  // 创建 DOM 元素
  const el = createElement(vnode.type)
  // 若children 是字符串，则为文本类型
  if(typeof vnode.children === 'string') {
    setElementText(el, vnode.children)
  } else if(Array.isArray(vnode.children)) {
    vnode.children.forEach(child => {
      path(null, child, el, options)
    })
  }
  // 设置属性
  if(vnode.props) {
    for(let key in vnode.props) {
      /**
       * 在设置属性时，优先设置元素的 DOM properties
       */
      patchProps(el, key, null, vnode.props[key])
    }
  }
  // 将 DOM 元素挂载到容器上
  insert(el, container)
}

// 有一些属性是只读的，因此只能使用 setAttribute 来设置
