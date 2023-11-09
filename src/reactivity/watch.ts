import { effect } from './effect'

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