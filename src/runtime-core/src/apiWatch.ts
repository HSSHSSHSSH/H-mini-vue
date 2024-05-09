import { ReactiveEffect } from '../../reactivity/effect'
import { queuePreJobs } from './scheduler'

// watchEffect 的调用时机是组件渲染之前，与 runtime 有关
// watch 与 effect 与 渲染/runtime 无关
export function watchEffect(source) {
  let cleanup

  const onCleanup = (fn) => {
    cleanup = effect.onStop = fn
  }

  const getter = () => {
    if (cleanup) {
      cleanup()
    }
    source(onCleanup)
  }

  let effect: any = new ReactiveEffect(getter, {
    scheduler: () => {
      queuePreJobs(job)
    },
    // onStop: () => {
    //   cleanup()
    // }
  })

  function job() {
    effect.run()
  }
  effect.run()

  return () => {
    effect.stop()
  }
}
