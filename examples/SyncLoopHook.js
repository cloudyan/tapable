// SyncLoopHook 钩子的使用
// 串行同步执行，如果 task 返回值 !== undefined，则重新循环一遍 tasks，
// 直到返回 undefined，则继续向下执行其他事件处理函数，以此类推
const { SyncLoopHook } = require("../lib");

// 创建实例
let syncLoopHook = new SyncLoopHook(["name", "age"]);

// 定义辅助变量
let total1 = 0;
let total2 = 0;

// 注册事件
syncLoopHook.tap("1", (name, age) => {
	console.log("1", name, age, total1);
	if (total1++ < 2) {
		return total1
	}
});

syncLoopHook.tap("2", (name, age) => {
	console.log("2", name, age, total2);
	if (total2++ < 2) {
		return total2
	}
});

syncLoopHook.tap("3", (name, age) => console.log("3", name, age));

// 触发事件，让监听函数执行
syncLoopHook.call("panda", 18);

// 1 panda 18 0
// 1 panda 18 1
// 1 panda 18 2
// 2 panda 18 0
// 1 panda 18 3
// 2 panda 18 1
// 1 panda 18 4
// 2 panda 18 2
// 3 panda 18



// 模拟 SyncLoopHook 类
class MockSyncLoopHook {
	constructor(args) {
		this.args = args;
		this.tasks = [];
	}
	tap(name, task) {
		this.tasks.push(task);
	}
	call(...args) {
		// 传入参数严格对应创建实例传入数组中的规定的参数，执行时多余的参数为 undefined
		args = args.slice(0, this.args.length);

		// 依次执行事件处理函数，如果返回值 !== undefined，则重新来一遍 tasks
		// 直到返回 undefined，则继续向下执行其他事件处理函数
		// forEach 无法中断，不适合实现此方法
		// this.tasks.forEach(task => {
		// 	let ret;
		// 	do {
		// 		ret = this.task(...args);
		// 	} while (ret !== undefined);
		// });

		// or
		let loop
		do {
			loop = false
			let i = 0
			let result = false
			let task

			do {
				task = this.tasks[i]
				result = task(...args)
				if (result !== undefined) {
					loop = true
				}
				i++
			} while (result === undefined && i < this.tasks.length)
		} while (loop)
	}
}


// SyncLoopHook 类的 call 方法和 SyncBailHook 的 call 方法不同
// SyncBailHook 返回值控制外层循环整个 tasks 事件函数队列一次，满足条件（!== undefined）就跳过后面的，然后就结束了，
// 而 SyncLoopHook 返回值控制外层循环多次，满足条件（!== undefined）就跳过后面的，但又从头重新开始了而不是退出，直到所有 task 都不满足条件（全 === undefined）

/**

这个方法刚看到可能不容易理解，可以参看以下代码，就容易理解了

记所有事件处理函数队列为 tasks
记单个事件处理函数为 task

如果当前 task 返回值 !== undefined，则忽略此 task 后面的 tasks，重新循环执行所有 tasks，否则执行下一个 task，以此类推

// compile 输出

// loop 循环控制开始
var _loop;
do {
	_loop = false;

	// series 串行输出开始
	var _fn0 = _x[0];
	var _result0 = _fn0(name, age);
	if (_result0 !== undefined) {
		_loop = true;
	} else {
		var _fn1 = _x[1];
		var _result1 = _fn1(name, age);
		if (_result1 !== undefined) {
			_loop = true;
		} else {
			var _fn2 = _x[2];
			var _result2 = _fn2(name, age);
			if (_result2 !== undefined) {
				_loop = true;
			} else {
				if (!_loop) {
				}
			}
		}
	}

	// series 串行输出结束
} while(_loop);

// loop 循环控制结束

*/


