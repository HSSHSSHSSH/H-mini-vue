import { reactive } from '../reactive'
import { effect } from '../effect'

describe("effect", () => {
  it("happy path", () => {
    const user = reactive({
      age: 10
    })
    let nextAge
    effect(() => {
      nextAge = user.age + 1
    })
    expect(nextAge).toBe(11)
    user.age++
    expect(nextAge).toBe(12)
  })

  it("should return runner when call effect", () => {
    let foo = 10
    const runner = effect(() => {
      foo++
    })
    expect(foo).toBe(11)
    runner()
    expect(foo).toBe(12)
  })

  it('scheduler', () => {
    let dummy 
    let run: any
    const scheduler = jest.fn(() => {
      run = runner
    })
    const obj = reactive({ foo: 1 })
    const runner = effect(
      () => {
        dummy = obj.foo
      },
      { scheduler }
    )
      expect(scheduler).not.toHaveBeenCalled()
      expect(dummy).toBe(1)
      // scheduler should be called on first trigger
      obj.foo++
      expect(scheduler).toHaveBeenCalledTimes(1)
      // should not run yet
      expect(dummy).toBe(1)
      // manually run
      run()
      // should have run
      expect(dummy).toBe(2)

  })

  it('stop', () => {
    let dummy
    const obj = reactive({ prop: 1 })
    const runner = effect(() => {
      dummy = obj.prop
    })
    obj.prop = 2
    expect(dummy).toBe(2)
    runner.stop()
    obj.prop = 3
    expect(dummy).toBe(2)
    // stopped effect should still be manually callable
    runner()
    expect(dummy).toBe(3)
  })

  it('onStop', () => {
    const obj = reactive({ foo: 1 })
    const onStop = jest.fn()
    let dummy
    const runner = effect(
      () => {
        dummy = obj.foo
      },
      {
        onStop
      }
    )
    runner.stop()
    expect(onStop).toHaveBeenCalledTimes(1)
  })

})