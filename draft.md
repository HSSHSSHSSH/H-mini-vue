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



## 双端 diff

## 快速 diff



