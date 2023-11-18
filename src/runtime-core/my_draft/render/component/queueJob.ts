const queue: Set<Function> = new Set() 
let isFlushing = false

const p = Promise.resolve()

export function queueJob(job) {
  queue.add(job)
  if (!isFlushing) {
    isFlushing = true
    p.then(() => {
      try {

        queue.forEach(job => job())
      } finally {
        queue.clear()
        isFlushing = false
      }
    })
  }
}