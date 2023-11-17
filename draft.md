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

简单 diff 算法对于可复用 DOM 的移动操作存在明显缺陷，观察下例：

```ts
let newChildren = [
    {type: 'p', children: '3', key: '3'},
    {type: 'p', children: '1', key: '1'},
    {type: 'p', children: '2', key: '2'}
]
let newChildren = [
    {type: 'p', children: '1', key: '1'},
    {type: 'p', children: '2', key: '2'},
    {type: 'p', children: '3', key: '3'}
]
```

若用简单 diff 算法，将会进行两次移动操作，即移动 p-1 与 p-2，显然只需移动 p-3即可。对于简单 diff 算法，遍历的过程是从数组的开端向数组的末端遍历，故会出现这种情况，为优化之，我们采取从两端到中间的遍历方法，即双端 diff 算法。

以下先讨论可复用 DOM 的移动情况：

```ts
function double_end_diff(n1, n2, container, options) {
    let oldChildren = n1.children
    let newChildren = n1.children
    // 引入两个数组的两个端点索引值
    let oldStartIndex = 0
    let oldEndIndex = 0
    let newStartIndex = 0
    let newEndStartIndex = 0
}
```

以下开始遍历数组，在遍历数组的过程中，每处理一个开端节点，将开端索引向后移动一个，每处理一个末端节点，将末端索引向前移动一个，之后更新活跃的新旧节点，进行下一次遍历，当开端索引值小于末端索引值时，说明两个数组均遍历结束，即

```ts
function double_end_diff(n1, n2, container, options) {
    /..其余代码../
    while(oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
        // 找到可复用的 DOM 节点，进行更新移动操作
    }
}
```

在寻找可复用 DOM 节点的过程中，我们始终关心的是两端的节点，即在 oldStartNode 、oldEndNode、newStartNode、newEndNode，中是否存在可复用的节点，若有则执行更新移动操作并更新两端索引值：

```ts
function double_end_diff(n1, n2, container, options) {
    /..其余代码../
    const {insert} = options
    let oldStartNode, oldEndNode, newStartNode, newEndNode
    while(oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
        oldStartNode = oldChildren[oldStartIndex]
        oldEndNode = oldChildren[oldEndIndex]
        newStartNode = newChildren[newStartIndex]
        newEndNode = newChildren[newEndIndex]
        if(oldStartNode.key === newStartNode.key) {
            // oldChildren 的开端与 newChildren 的开端比较
            path(oldStartNode, newStartNode, container, options)
            // 均在开端 无需移动，仅更新索引即可
            oldStartIndex++
            newStartIndex++
        } else if(oldEndNode.key === newEndNode.key) {
            // oldChildren 的末端与 newChildren 的末端比较
            patch(oldEndNode, newEndNode, container, options)
            // 均在末端，无需移动，仅更新索引即可
            oldEndIndex--
            newEndIndex--
        } else if(oldStartNode.key === newEndNode.key) {
            // oldChildren 的开端与 newChildren 的末端比较
            patch(oldStartNode, newEndNode, container, options)
            // 需将 oldStatNode 移动到末端，更新索引
            insert(oldStartNode.el, container, oldEndNode,el,nextSibilng)
            oldStartIndex++
            newEndIndex--
        } else if(oldEndNode.key === newStartNode.key) {
            // oldChildren 的末端与 newChildren 的开端比较
            patch(oldEndNode, newStartNode, container, options)
            // 需将 oldEndNode 移动到开端，更新索引
            insert(oldEndNode.el, container, oldStartNode.el)
            oldEndIndex--
            newStartIndex++
        }
    }
}
```

以上情况是一种比较理想的情况，即每次遍历的四个端点至少有一组可复用的，但在实际使用中，大多数情况不如这般理想，即可复用的一组 DOM ，一个位于端点，一个不位于端点；在此种情况的遍历回合中，我们取一端点，找到其对应的非端点元素，以下使用 newStarNode 进行实现：

```ts
function double_end_diff(n1, n2, container, options) {
    /.其余代码./
    while(oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
        if (oldStartNode.key === newStartNode.key) {
            /.其余代码./
        } else if (oldEndNode.key === newEndNode.key) {
            /.其余代码./
        } else if (oldStartNode.key === newEndNode.key) {
            /.其余代码./
        } else if(oldEndNode.key === newStartNode.key) {
            /.其余代码./
        } else {
            let idxInOld = oldChildren,findIndex(oldNode => oldNode.key === newStartNode.key)
            if(idxInOld > 0) {
                // 在 oldChildren 的非端点处找到了与 newStartNode 对应的元素
                patch(oldChildren[idxInOld], newStartNode, container, options)
                // 将找到的元素移动至开端
                insert(oldChildren[idxInOld].el, container, oldStartNode.el)
            } else {
                // 未找到与 newStartNode 对应的元素，即 newStartNode 为新增元素
                patch(null, newStartNode, container, options, oldStartNode.el)
            }
            newStartIndex++
        }
    }
}
```

对于上述情况，非端点元素 oldChildren[idxInOld] 已被处理，故当其在遍历过程中作为端点元素时，不再处理此元素，更新索引即可：

```ts
function double_end_diff(n1, n2, container, options) {
    /.其余代码./
    while(oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
        /.其余代码./
        if(oldStartNode === undefined) {
            oldStartIndex++
        } else if(oldEndNode === undefined) {
            oldEndInex--
        } else if (oldStartNode.key === newStartNode.key) {
            /.其余代码./
        } else if (oldEndNode.key === newEndNode.key) {
            /.其余代码./
        } else if (oldStartNode.key === newEndNode.key) {
            /.其余代码./
        } else if(oldEndNode.key === newStartNode.key) {
            /.其余代码./
        } else {
            let idxInOld = oldChildren,findIndex(oldNode => oldNode.key === newStartNode.key)
            if(idxInOld > 0) {
                // 在 oldChildren 的非端点处找到了与 newStartNode 对应的元素
                patch(oldChildren[idxInOld], newStartNode, container, options)
                // 将找到的元素移动至开端
                insert(oldChildren[idxInOld].el, container, oldStartNode.el)
                // 将找到的元素设为 undefined
                oldChildren[idxInOld] = undefined
            } else {
                // 未找到与 newStartNode 对应的元素，即 newStartNode 为新增元素
                patch(null, newStartNode, container, options, oldStartNode.el)
            }
            newStartIndex++
        }
    }
}
```

以遍历完成了可复用 DOM 的移动与部分新增元素操作，对于 newChildren 与 oldChildren ，存在以下情况：

- newChildren 与 oldChildren 均遍历完全，即 oldStartIndex > oldEndIndex && newStartIndex > newEndIndex，无需在做处理
- newChildren 遍历完全，oldChildren 未遍历完全， 即 oldStartIndex <= oldEndIndex && newStartIndex > newEndIndex，说明在  oldChildren 中仍存在需要卸载的元素。
- newChildren 未遍历完全，oldChildren 遍历完全，即 oldStartIndex > oldEndIndex && newStartIndex <= newEndIndex，说明在 newChildren 中存在需要仍存在需要新增的元素

则在遍历结束后还需对后两种情况进行判断：

```ts
function double_end_diff(n1, n2, container, options) {
    /.其余代码./
    while(oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
        /.其余代码./
    }
    if (oldStartIndex <= oldEndIndex && newStartIndex > newEndIndex) {
        // 存在需要卸载元素
        for(let i = oldStartIndex; i <= oldEndIndex; i++) {
            unmount(oldChildren[i])
        }
    }
    if(oldStartIndex > oldEndIndex && newStartIndex <= newEndIndex) {
        // 存在需要新增元素
        for(let i = newStartIndex; i <= newEndIndex; i++) {
            patch(null, newChildren[i], container, options, oldStartNode.el)
        }
    }
}
```



## 快速 diff

快速 diff 算法首先对两组节点进行预处理，即处理两端可复用的DOM

```ts
function fast_diff(n1, n2, container, options) {
    let oldChildren = n1.children
    let newChildren = n2.children
    // 处理前置节点
    let j = 0
    let oldVNode = oldChildren[j]
    let newVNode = newChildren[j]
    while(oldVNode.key  oldVNode.key === newVNode.key) { // 直到找不到可复用的元素
        // 更新元素，更新索引与节点
        patch(oldVNode, newVNode, container, options)
        j++
        oldVNode = oldChildren[j] || {}
        newVNode = newChildren[j] || {}
    }
    // 处理后置节点
    let oldEnd = oldChildren.length - 1
    let newEnd = newChildren.length - 1
    oldVNode = oldChildren[oldEnd]
    newVNode = newChildren[newEnd]
    while(oldVNode.key === newVNode.key) {
        patch(oldVNode, newVNode, container, options)
        oldEnd--
        newEnd--
        oldVNode = oldChildren[oldEnd] || {}
        newVNode = newChildren[newEnd] || {}
    }
}
```

经历以上预处理后，j 与 oldEnd、newEnd 的可能关系如下：

对于 oldChildren:

- j > oldEnd，此时 oldChildren 遍历完全
- j <= oldEnd, 此时 oldChildren 未遍历完全

同理，对于 newChildren:

- j > newEnd, 此时 newChildren 遍历完全
- j <= newEnd, 此时 newChildren 未遍历完全

综合上述情况，有 4 中情况

- j > oldEnd && j > newEnd，说明预处理已足够完成两组元素的更新操作，无需后续操作
- j > oldEnd && j <= newEnd, 说明此时仅存在需要新增的元素，后续操作需要遍历挂载这些元素
- j <= oldEnd && j > newEnd, 说明此时仅存在需要卸载的元素，后续操作需要遍历卸载这些元素
- j <= oldEnd && j < = newEnd, 此时可能存在需要新增的操作，可能存在需要卸载的操作，可能存在需要移动的操作

首先查看前三种比较简单的情况：

```ts
function fast_diff(n1, n2, container, options) {
    /.其余代码./
    if(j > oldEnd && j > newEnd) {
        // 无需操作
    } else if(j > oldEnd && j <= newEnd) {
        // 遍历挂载
    } else if(j <= oldEnd && j > newEnd) {
        // 遍历卸载
    } else if(j <= oldEnd && j < = newEnd) {
    
    }
}
```

可将第一个无需操作的判断分支移除：

```ts
function fast_diff(n1, n2, container, options) {
    /.其余代码./
    if(j > oldEnd && j <= newEnd) {
        // 遍历挂载
        for(let i = j; i <= newEnd; i++) {
            let anchor = newChildren[newEnd + 1] ? newChildren[newEnd + 1].el : null
            patch(null, newChildren[i], el, options, anchor)
        }
    } else if(j <= oldEnd && j > newEnd) {
        // 遍历卸载
        for(let i = j; i <= oldEnd; i++) {
            unmount(oldChildren[i])
        }
    } else if(j <= oldEnd && j < = newEnd) {
        
    }
}
```

在 j <= oldEnd && j <= newEnd 分支中需进行：

- 判断是否存在新增元素并正确挂载新增元素
- 判断是否存在减少元素并遍历卸载减少元素
- 判断是否存在可复用元素并将其移动到正确的位置

首先

```ts
function fast_diff(n1, n2, container, options) {
    if(j > oldEnd && j <= newEnd) {
        /.其余代码./
    } else if(j <= oldEnd && j > newEnd) {
        /.其余代码./
    } else if(j <= oldEnd && j <= newEnd) {
        // 新增
        for(let i = j; i <= newEnd; i++) {
            let find
            for(let k = j; k <= oldEnd; k++) {
                if(newChildren[i].key === oldChildren[k].key) {
                    find = true
                }
            }
            if(!find) {
                // 执行新增操作
            }
        }
        // 减少
        for (let i = j; i <= oldEnd; i++) {
            let find
            for(let k = j; k <= newEnd; k++) {
                if(oldChildren[j].key === newChildren[k].key) {
                    find = true
                }
            }
            if(!find) {
                // 执行卸载操作
            }
        }
        // 移动
    }
}
```

进行到此处，此分支的时间复杂度未 O((newEnd - j)*(oldEnd - j))，通常此时会引入一个 Map 来降低时间复杂度为:

 O(max{ (newEnd - j), (oldEnd - j) })，Map 有两种可选择的结构

```ts
let Map1 = {
    oldVNodeKey: oldVNodeIndex
}
let Map2 = {
    newVNodeKey: newVNodeIndex
}
```

```ts
function fast_diff(n1, n2, container, options) {
    if(j > oldEnd && j <= newEnd) {
        /.其余代码./
    } else if(j <= oldEnd && j > newEnd) {
        /.其余代码./
    } else if(j <= oldEnd && j <= newEnd) {
        let oldKeyIndex = {}
        let newKeyIndex = {}
        for (let i = j; i <= oldEnd; i++) {
            oldKeyIndex[oldChildren[i].key] = i
        }
        for(let i = j; i <= newEnd; i++) {
            newKeyIndex[newChildren[i].key] = i
        }
        // 新增
        for(let i = j; i <= newEnd; i++) {
            let idx = oldKeyIndex[newChildren[i].key]
            if(idx === undefined) { // 未找到对应的 key, 说明此节点为新增节点
                let anchor = newChildren[i - 1] ? newChildren[i - 1].el.nextSibling : container.firstChild
                patch(null, newChildren[i], container, options, )
            } else {
                patch(oldChildren[idx], newChildren[i], container, options)
            }
        }
        // 减少
        for(let i = j; i <= oldEnd; i++) {
            let idx = newKeyIndex[oldChildren[i].key]
            if(idx === undefined) { // 未找到对应的 key，说明此节点为减少节点
                unmount(oldChildren[i])
            } else {
                patch(oldChildren[idx], newChildren[i], container, options)
            }
        }
        // 移动
    }
}
```



至此，完成此 else 分支的挂载与卸载的判断与操作，并降低了空间复杂度，以下来进行移动的操作；在进行移动操作之前，需要判断是否需要移动操作，即：

```ts
function fast_diff(n1, n2, container, options) {
    if(j > oldEnd && j <= newEnd) {
        /.其余代码./
    } else if(j <= oldEnd && j > newEnd) {
        /.其余代码./
    } else if(j <= oldEnd && j <= newEnd) {
        let oldKeyIndex = {}
        let newKeyIndex = {}
        let need_move = false
        for (let i = j; i <= oldEnd; i++) {
            oldKeyIndex[oldChildren[i].key] = i
        }
        for(let i = j; i <= newEnd; i++) {
            newKeyIndex[newChildren[i].key] = i
        }
        // 新增
        for(let i = j; i <= newEnd; i++) {
            let idx = oldKeyIndex[newChildren[i].key]
            if(idx === undefined) { // 未找到对应的 key, 说明此节点为新增节点
                let anchor = newChildren[i - 1] ? newChildren[i - 1].el.nextSibling : container.firstChild
                patch(null, newChildren[i], container, options, )
            } else {
                patch(oldChildren[idx], newChildren[i], container, options)
                need_move = true
            }
        }
        // 减少
        for(let i = j; i <= oldEnd; i++) {
            let idx = newKeyIndex[oldChildren[i].key]
            if(idx === undefined) { // 未找到对应的 key，说明此节点为减少节点
                unmount(oldChildren[i])
            } else {
                patch(oldChildren[idx], newChildren[i], container, options)
                need_move = true
            }
        }
        // 移动
        if(!need_move) return
    }
}
```



找到需要移动的元素并将其移动到正确的位置，在进行移动的操作时，我们希望尽可能少的移动元素，这就需要找到保持其相对位置最长的一组子节点，这些节点之外的元素需要移动，以下进行操作：

- 计算出 newChildren[i] 在 oldChildren 中的索引数组 source
- 计算 source 的最长递增子序列

```ts
function fast_diff(n1, n2, container, options) {
    if() {
        
    } else if () {
        
    } else if() {
        /.其余代码./
        // 移动
        let source = new Array(count).fill(-1) // 用于存放新节点对应旧节点的索引
        for(let i = j; i <= newEnd; i++) {
            let idx = oldKeyIndex[newChildren[i].key]
            if(idx !== undefined) { 
                source[i - j] = idx
            }
        }
        let seq = lis(source)
    }
}

// 计算最长递增子序列，返回最长增长子序列在原数组中的索引
function lis(arr) {
  let len = arr.length
  let result = [0]
  let p = arr.slice(0)
  let start
  let end
  let middle
  for (let i = 0; i < len; i++) {
    let arrI = arr[i]
    if (arrI !== 0) {
      let resultLastIndex = result[result.length - 1]
      if (arr[resultLastIndex] < arrI) {
        p[i] = resultLastIndex
        result.push(i)
        continue
      }
      start = 0
      end = result.length - 1
      while (start < end) {
        middle = ((start + end) / 2) | 0
        if (arr[result[middle]] < arrI) {
          start = middle + 1
        } else {
          end = middle
        }
      }
      if (arrI < arr[result[start]]) {
        if (start > 0) {
          p[i] = result[start - 1]
        }
        result[start] = i
      }
    }
  }
  start = result.length
  end = result[start - 1]
  while (start-- > 0) {
    result[start] = end
    end = p[end]
  }
  return result
}
```

接下来进行移动操作，根据 seq 与 source 进行移动的判断：

- source[i] === -1 ，此为新增的元素，因之前已处理过，所以不做操作
- i !== seq[s]，s 与遍历方向有关，从前向后遍历 source 或 从后向前，若是从前向后遍历，则 i !== seq[s] 等价于 i > seq[s]，若从后向前遍历，则 i !== seq[s]  等价于 i < seq[s]，否则违背 seq 的定义。此时当前节点需要移动
- i === seq[s]，此时当前节点无需移动，将 s 移向下一个元素

```ts
function fast_diff(n1, n2, container, options) {
    if() {
        
    } else if () {
        
    } else if() {
        /.其余代码./
        // 移动
        let count = newEnd - j + 1 // 新节点数组中未处理的节点数量
        let source = new Array(count).fill(-1) // 用于存放新节点对应旧节点的索引
        for(let i = j; i <= newEnd; i++) {
            let idx = oldKeyIndex[newChildren[i].key]
            if(idx !== undefined) { 
                source[i - j] = idx
            }
        }
        let seq = lis(source)
        let s = seq.length - 1
        let i = source.length - 1
        for(i; i>=0; i--) {
            if(i !== seq[s]) {
                //需要移动
                let pos = i + newStart // 新节点在新节点数组中的索引
                let nextPos = pos + 1 // 新节点在新节点数组中的下一个索引
                // 新节点在新节点数组中的下一个节点
                let anchor = nextPos < newChildren.length ? newChildren[nextPos].el : null 
                insert(newChildren[pos].el, container, anchor) // 移动节点
            } else if(source[i] === -1) {
                // 之前已做过卸载操作，故在此不做操作
            } else {
                // 不需要移动
                s--
            }
        }
    }
}
```

完整代码如下：

```ts
export function fast_diff(n1, n2, container, options) {
  const { insert, unmount } = options
  let oldChildren = n1.children
  let newChildren = n2.children
  // 处理前置节点
  let j = 0
  let oldVNode = oldChildren[j]
  let newVNode = newChildren[j]
  while (oldVNode.key && newVNode.key && oldVNode.key === newVNode.key) {
    // 直到找不到可复用的元素
    // 更新元素，更新索引与节点
    patch(oldVNode, newVNode, container, options)
    j++
    oldVNode = oldChildren[j] || {}
    newVNode = newChildren[j] || {}
  }
  // 处理后置节点
  let oldEnd = oldChildren.length - 1
  let newEnd = newChildren.length - 1
  oldVNode = oldChildren[oldEnd] || {}
  newVNode = newChildren[newEnd] || {}
  while (oldVNode.key && newVNode.key && oldVNode.key === newVNode.key) {
    patch(oldVNode, newVNode, container, options)
    oldEnd--
    newEnd--
    oldVNode = oldChildren[oldEnd] || {}
    newVNode = newChildren[newEnd] || {}
  }
  if (j > oldEnd && j <= newEnd) {
    // 遍历挂载
    for (let i = j; i <= newEnd; i++) {
      let anchor = newChildren[newEnd + 1] ? newChildren[newEnd + 1].el : null
      patch(null, newChildren[i], container, options, anchor)
    }
  } else if (j <= oldEnd && j > newEnd) {
    // 遍历卸载
    for (let i = j; i <= oldEnd; i++) {
      unmount(oldChildren[i])
    }
  } else if (j <= oldEnd && j <= newEnd) {
    let oldKeyIndex = {}
    let newKeyIndex = {}
    for (let i = j; i <= oldEnd; i++) {
      oldKeyIndex[oldChildren[i].key] = i
    }
    for (let i = j; i <= newEnd; i++) {
      newKeyIndex[newChildren[i].key] = i
    }
    let need_move = false
    // 新增
    for (let i = j; i <= newEnd; i++) {
      let idx = oldKeyIndex[newChildren[i].key]
      if (idx === undefined) {
        // 未找到对应的 key, 说明此节点为新增节点

        let anchor = newChildren[i - 1]
          ? newChildren[i - 1].el.nextSibling
          : container.firstChild
        patch(null, newChildren[i], container, options, anchor)
      } else {
        patch(oldChildren[idx], newChildren[i], container, options)
        need_move = true
      }
    }
    // 减少
    for (let i = j; i <= oldEnd; i++) {
      let idx = newKeyIndex[oldChildren[i].key]
      if (idx === undefined) {
        // 未找到对应的 key，说明此节点为减少节点
        unmount(oldChildren[i])
      } else {
        patch(oldChildren[idx], newChildren[i], container, options)
        need_move = true
      }
    }
    if (!need_move) return
    let count = newEnd - j + 1 // 新节点数组中未处理的节点数量
    let source = new Array(count).fill(-1) // 用于存放新节点对应旧节点的索引
    for (let i = j; i <= newEnd; i++) {
      let idx = oldKeyIndex[newChildren[i].key]
      if (idx !== undefined) {
        source[i - j] = idx
      }
    }
    let seq = lis(source)
    // 移动
    let s = seq.length - 1
    let i = source.length - 1
    for (i; i >= 0; i--) {
      if (i !== seq[s]) {
        //需要移动
        let pos = i + j // 新节点在新节点数组中的索引
        let nextPos = pos + 1 // 新节点在新节点数组中的下一个索引
        // 新节点在新节点数组中的下一个节点
        let anchor =
          nextPos < newChildren.length ? newChildren[nextPos].el : null

        patch(oldChildren[source[i]], newChildren[pos], container, options)

        insert(newChildren[pos].el, container, anchor) // 移动节点
      } else if (source[i] === -1) {
        // 之前已做过卸载操作，故在此不做操作
      } else {
        // 不需要移动
        s--
      }
    }
  }
}

function lis(arr) {
  let len = arr.length
  let result = [0]
  let p = arr.slice(0)
  let start
  let end
  let middle
  for (let i = 0; i < len; i++) {
    let arrI = arr[i]
    if (arrI !== 0) {
      let resultLastIndex = result[result.length - 1]
      if (arr[resultLastIndex] < arrI) {
        p[i] = resultLastIndex
        result.push(i)
        continue
      }
      start = 0
      end = result.length - 1
      while (start < end) {
        middle = ((start + end) / 2) | 0
        if (arr[result[middle]] < arrI) {
          start = middle + 1
        } else {
          end = middle
        }
      }
      if (arrI < arr[result[start]]) {
        if (start > 0) {
          p[i] = result[start - 1]
        }
        result[start] = i
      }
    }
  }
  start = result.length
  end = result[start - 1]
  while (start-- > 0) {
    result[start] = end
    end = p[end]
  }
  return result
}
```

以下我们来优化以上代码，可将重复的遍历合并：

```ts
function fast_diff(n1, n2, el, options) {
  const { insert, unmount } = options
  let oldChildren = n1.children
  let newChildren = n2.children
  // 从前向后比较
  let j = 0
  let oldVNode = oldChildren[j]
  let newVNode = newChildren[j]
  while (oldVNode.key === newVNode.key) {
    //预处理
    /**
     * 打补丁
     * 更新索引，更新 oldVNode, newVNode
     */
    patch(oldVNode, newVNode, el, options)
    j++
    oldVNode = oldChildren[j] || {}
    newVNode = newChildren[j] || {}

  }
  // 从后向前比较
  let oldEnd = oldChildren.length - 1
  let newEnd = newChildren.length - 1
  oldVNode = oldChildren[oldEnd]
  newVNode = newChildren[newEnd]
  while (oldVNode.key === newVNode.key) {
    //预处理
    /**
     * 打补丁
     * 更新索引，更新 oldVNode, newVNode
     */
    patch(oldVNode, newVNode, el, options)
    oldEnd--
    newEnd--
    oldVNode = oldChildren[oldEnd] || {}
    newVNode = newChildren[newEnd] || {}
  }
  // 判断是否有需要新增与卸载的节点
  if (j <= newEnd && j > oldEnd) {
    // 仅有新增节点
    for (let i = j; i <= newEnd; i++) {
      // 新增节点
      let anchor = newChildren[newEnd + 1] ? newChildren[newEnd + 1].el : null
      patch(null, newChildren[i], el, options, anchor)
    }
  } else if (j > newEnd && j <= oldEnd) {
    // 仅有卸载节点
    for (let i = j; i <= oldEnd; i++) {
      // 卸载节点
      unmount(oldChildren[i])
    }
  } else {
    // 非理想情况
    let count = newEnd - j + 1 // 新节点数组中未处理的节点数量
    let source = new Array(count).fill(-1) // 用于存放新节点对应旧节点的索引
    let oldStart = j
    let newStart = j
    let keyIndex = {} // newNodeKey: newNodeIndex
    let move = false // 是否需要移动
    let lastIndex = 0 // 在遍历遍历旧节点时遇到的最大索引值
    let patched = 0 // 已处理的新节点的数量
    for (let i = newStart; i <= newEnd; i++) {
      keyIndex[newChildren[i].key] = i
    }
    // 更新 source 数组
    for (let i = oldStart; i <= oldEnd; i++) {
      let oldVNode = oldChildren[i]
      if (patched <= count) { // 当已处理的节点数量小于未处理的节点数量时，继续处理
        /**
         * idx是旧节点在未处理新节点数组中的索引
         */
        let idx = keyIndex[oldChildren[i].key]
        if (idx === undefined) {
          // 旧节点在新节点中不存在
          unmount(oldChildren[i])
        } else {
          // 旧节点在新节点中存在
          /**
           * 打补丁
           * 填充source
           */
          patch(oldVNode, newChildren[idx], el, options)
          patched++
          source[idx - newStart] = i
          // 判断节点是否需要移动
          if (idx < lastIndex) {
            move = true
          } else {
            lastIndex = idx
          }
        }
      } else {
        unmount(oldChildren[i])
      }
    }
    if (move || patched < newEnd - 1) { // 需要执行移动的操作
      /**
       * 1. 找到需要移动的元素
       * 2. 移动到正确的位置
       */
      let seq = lis(source)
      let s = seq.length - 1 // 最长递增子序列的最后一个索引
      let i = source.length - 1 // 未处理的新节点数组的最后一个索引
      for(i; i >= 0; i--) { // 遍历未处理的新节点数组
        if(source[i] === -1) { // 未处理的新节点数组中的节点在旧节点数组中不存在
          let pos = i + newStart // 新节点在新节点数组中的索引
          let nextPos = pos + 1 // 新节点在新节点数组中的下一个索引
          let anchor = nextPos < newChildren.length ? newChildren[nextPos].el : null // 新节点在新节点数组中的下一个节点
          patch(null, newChildren[pos], el, options, anchor) // 新增节点
        }else if(i !== seq[s]) {
          // 需要移动
          let pos = i + newStart // 新节点在新节点数组中的索引
          let nextPos = pos + 1 // 新节点在新节点数组中的下一个索引
          let anchor = nextPos < newChildren.length ? newChildren[nextPos].el : null // 新节点在新节点数组中的下一个节点
          insert(newChildren[pos].el, el, anchor) // 移动节点
        } else {
          // 不需要移动
          s--
        }
      }
    }
  }
}
```



