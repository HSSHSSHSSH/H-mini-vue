import { reactive } from '../../reactivity/reactive'
import { watchEffect } from '../src/apiWatch'
import { nextTick } from '../src/scheduler'

describe('api watch', () => {
  it('effect', async () => {
    const state = reactive({ count: 0 })
    let dummy
    watchEffect(() => {
      dummy = state.count
    })
    expect(dummy).toBe(0)
    state.count++
    await nextTick() // 存在疑问
    expect(dummy).toBe(1)
  })

  it('stop the watcher(effect)', async() => {
    const state = reactive({ count: 0 })
    let dummy
    const stop: any =  watchEffect(() => {
      dummy = state.count
    })
    expect(dummy).toBe(0)
    state.count++
    await nextTick()
    expect(dummy).toBe(1)
    stop()
    state.count++
    await nextTick()
    expect(dummy).toBe(1)
  })

  it('cleanup registration (effect)', async () => {
    const state = reactive({ count: 0 })
    let cleanup = jest.fn()
    let dummy
    const stop: any =  watchEffect((onCleanup) => {
      onCleanup(cleanup)
      dummy = state.count
    })
    expect(dummy).toBe(0)
    state.count++
    await nextTick()
    expect(cleanup).toHaveBeenCalledTimes(1)

    expect(dummy).toBe(1)
    stop()
    state.count++
    await nextTick()
    expect(cleanup).toHaveBeenCalledTimes(2)

    expect(dummy).toBe(1)
  })


})
