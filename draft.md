# diff 算法

diff 算法是用来更新节点中的子元素的方法，在更新的过程中要尽可能高效的：

- 找到新增的元素并将其插入正确的位置
- 找到减少的元素并将其卸载
- 找到可复用的元素，将其内容更新后放到正确的位置

## 简单 diff

```ts
function easy_diff(n1, n2, container, options) {
    // n1 为旧的节点，n2 为新的节点，container 为父元素，options 为节点操作对象
}
```

在节点与节点的 children 中，存在一 key 属性，用来判断此节点是否可复用，若 n1.children 中某子节点与 n2.children 中某子节点的 key 值相同，则说明此节点可复用，需将其内容更新后插入正确的位置；需要将 n1.children 与 n2.children 均遍历，找到可复用的元素：

```ts
function easy_diff(n1, n2, container, options) {
    let oldChildren = n1.children
    let newChildren = n2.children
    let oldLen = n1.children.length
    let newLen = n2.children.length
    const { insert } = options
    for(let i = 0; i < newLen; i++) {
        let newVNode = newChildren[i]
        for(let j = 0; j < oldLen; j++) {
            let oldVNode = oldChildren[j]
            if(newVNode.key === oldVNode.key) {
                patch(oldVNode, newVNode, container, options) // 更新元素内容，即打补丁
                // 进行移动操纵
            }
        }
    }
}
```

找到可复用的元素且打补丁完成后，需要进行移动操作，首先需要判断当前活跃的节点是否需要移动，在此引入变量 lastIndex，其含义为：在遍历过程中，newVNode 在 oldChildren 中的最大索引，即已处理的需要移动的DOM元素在 oldChildren 中最后面的元素的索引，因移动操作是对 oldChildren 的操作，主要观察对象为 oldChildren，初始值为0；观察以上代码，某一刻 newVNode 在 oldChildren 中的索引为 j ，观察 j 与 lastIndex 的大小关系：

- j >= lastIndex

  - lastIndex 为 0，即初始状态

    对当前元素节点的移动处理操作为：不移动

    更新 lastIndex = j

  - lastIndex 不为 0

    说明当前元素节点相对于已处理的可复用元素节点的相对位置为：当前元素节点在后面，故对当前元素节点的移动处理操作为：不移动

    更新 lastIndex = j

- j < lastIndex

  此时 lastIndex 必不可能为0，说明当前元素节点需要移动

根据以上分析，更新代码如下：

```ts
function easy_diff(n1, n2, container, options) {
    /...其余代码.../
    let lastIndex = 0
    for(let i = 0; i < newLen; i++) {
        let newVNode = newChildren[i]
        for(let j = 0; j < oldLen; j++) {
            let oldVNode = oldChildren[j]
            if(newVNode.key === oldVNode.key) {
                patch(oldVNode, newVNode, container, options) // 更新元素内容，即打补丁
                // 进行移动操纵
                if(j < lastIndex) {
                    // 移动
                    // 在进行移动操作时，主要参考 newChildren
                    let prveVNode = newChildren[i-1] // 将上一个处理的 newVNode 作为参考
                    if(preVNode) {
                        // 将 newVNode 插在 preVNode 之后
                        let anchor = preVNode.el.NextSibling
                        container.insertBefore(newVNode.el, anchor)
                    } else { // 上一个不存在，当前是第一个
                        // 不做任何操作
                    }
                } else {
                    lastIndex = j
                }
            }
        }
    }
}
```

当 preVNode 不存在时，可将 else 分支去掉：

```ts
function easy_diff(n1, n2, container, options) {
    /...其余代码.../
    let lastIndex = 0
    for(let i = 0; i < newLen; i++) {
        let newVNode = newChildren[i]
        for(let j = 0; j < oldLen; j++) {
            let oldVNode = oldChildren[j]
            if(newVNode.key === oldVNode.key) {
                patch(oldVNode, newVNode, container, options) // 更新元素内容，即打补丁
                // 进行移动操纵
                if(j < lastIndex) {
                    // 移动
                    // 在进行移动操作时，主要参考 newChildren
                    let prveVNode = newChildren[i-1] // 将上一个处理的 newVNode 作为参考
                    if(preVNode) {
                        // 将 newVNode 插在 preVNode 之后
                        let anchor = preVNode.el.NextSibling
                        container.insertBefore(newVNode.el, anchor)
                    }
                } else {
                    lastIndex = j
                }
            }
        }
    }
}
```

以上完成了可复用 DOM 元素的更新与移动，以下来处理节点的新增。

对于 newChildren 中的每个元素 newVNode，在遍历 oldChildren 后并未发现与 newVNode.key 相同的元素，此 newVNode 即为新增元素，引入变量 find 来判断当前 newVNode 是否为新增元素：

```ts
function easy_diff(n1, n2, container, options) {
    /...其余代码..../
    for(let i = 0; i < newLen; i++) {
        let newVNode = newChildren[i]
        let find = false
        for(let j = 0; j < oldLen; j++) {
            let oldVNode = oldChildren[j]
            if(newVNode.key === oldVNode.key) {
                find = true
                /...其余代码.../
            }
        }
        if(!find) { // 未找到与之对应的节点
            // 当前 newVNode 是新增元素，需执行挂载操作并将其插入正确位置
            // 未找到对应的旧节点，说明是新增的节点
            let preVNode = newChildren[i - 1]
            let anchor = preVNode ? preVNode.el.nextSibling : el.firstChild // 获取当前节点的下一个节点
            patch(null, newNode, el, options, anchor)
        }
    }
}
```

至此，完成了新增节点的操作，以下来进行卸载节点的操作。

类似新增操作，卸载操作的操作对象是 oldChildren，参照对象是 newChildren，故外侧遍历 oldChildren，内层遍历 newChildren，即：

```ts
function easy_diff(n1, n2, container, options) {
    /..其余代码../
    for(let i = 0; i < newLen; i++) {
        for(let j = 0; j < oldLen; j++) {
            // 新增与移动,操作对象是 newChildren，参照对象是 oldChildren,故外层遍历 newChildren,内层遍历 oldChildren
        }
    }
    // 卸载操作，操作对象是 oldChildren
    for(let i = 0; i < oldLen; i++) { // 外层遍历 oldChildren
        let oldNode = oldChildren[i]
        let has = newChildren.find((newNode) => newNode.key === oldNode.key)  // 内层遍历 newChildren
        if(!has) {
            unmount(oldNode)
        }
    }
}
```

以上便是简单diff算法的实现。

## 双端 diff



## 快速 diff



