class MyClass {
  constructor(initialValue) {
    // 私有变量，约定使用下划线前缀
    this._val = initialValue;
  }

  // Getter方法
  get value() {
    console.log('get 触发');
    return this._val;
  }

  // Setter方法
  set value(newValue) {
    console.log('set 触发');
    this._val = newValue;
  }
}

// 创建一个实例
const myInstance = new MyClass(42);

// 使用getter获取私有变量的值

// 使用setter设置私有变量的值
myInstance.value = 100;
