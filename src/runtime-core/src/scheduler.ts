




const queue: any[] = [] // 需要执行的任务队列
const activePreQueue: Function[] = [] //在任务队列执行之前执行的任务队列
let isFlushPending = false
const p = Promise.resolve()

export function queuePreJobs(job) { // 向 activePreQueue 中添加任务
  activePreQueue.push(job)
  queueFlush()
}

export function queueJobs(job) { // 向 queue 中添加任务

  if(!queue.includes(job)) {
    queue.push(job)
  }

  queueFlush()

}

function queueFlush() {
  if(isFlushPending) return 
  isFlushPending = true
  nextTick(flushJobs)
}

export function nextTick(fn?) {
  return fn ? p.then(fn) : p
}

function flushJobs() { // 依次运行任务队列
  isFlushPending = false
  // watchEffect 的执行时机，即在组件渲染之前
  flushPreJobs()

  let job
  while(job = queue.shift()) {
    job && job()
  }
}

function flushPreJobs() { // 依次运行 preQueue
  for(let i = 0; i < activePreQueue.length; i++) {
    activePreQueue[i]()
  }
}