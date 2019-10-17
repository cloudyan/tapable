
// AsyncParallelHook 钩子的使用
// 异步并行是指，事件处理函数内三个定时器的异步操作最长时间为 3s，而三个事件处理函数执行完成总共用时接近 3s，所以三个事件处理函数是几乎同时执行的，不需等待。
// 注册事件方法 tap tapAsync tapPromise
// 触发事件方式 call callAsync promise
const { AsyncParallelHook } = require('../lib');

// 创建实例
const tapParallelHook = new AsyncParallelHook(['name', 'age']);
const asyncParallelHook = new AsyncParallelHook(['name', 'age']);
const promiseParallelHook = new AsyncParallelHook(['name', 'age']);

// debugger

// 也可以使用 tap 未测试
// tapParallelHook.tap(1, (name, age))

// tapAsync 注册事件
// 所有 `tabAsync` 注册的事件处理函数最后一个参数都为一个回调函数 `done`，每个事件处理函数在异步代码执行完毕后调用 `done` 函数，则可以保证 `callAsync` 会在所有异步函数都执行完毕后执行。
console.time('time1');
asyncParallelHook.tapAsync('1', (name, age, done) => {
	setTimeout(() => {
		console.log('1', name, age, new Date());

		// 第一个参数为 err，本意是返回 err，则触发 done，并终止其他所有 task，
		// 但这里使用 setTimeout 模拟，触发终止时，其他task 已开始执行
		// 所以此时第一个参数返回 err，表现为第一个 task 就触发了 done 回调，但无法拦截终止其他 task，他们仍然执行，但不再触发 done 回调了
		// 如果这里不用 setTimeout 模拟，就可以看到效果
		done();
	}, 1000);
});

asyncParallelHook.tapAsync('2', (name, age, done) => {
	setTimeout(() => {
		console.log('2', name, age, new Date());
		done();
	}, 2000);
});

asyncParallelHook.tapAsync('3', (name, age, done) => {
	setTimeout(() => {
		console.log('3', name, age, new Date());
		done();
		console.timeEnd('time1');
	}, 3000);
});

// 触发事件，让监听函数执行
asyncParallelHook.callAsync('panda', 18, err => {
	// res is undefined for AsyncParallelHook
	// 注意这里回调就只有一个参数 err，没有 res
	console.log('complete async:', err);
});

// 1 panda 18 2019-10-16T14:22:01.795Z
// 2 panda 18 2019-10-16T14:22:02.798Z
// 3 panda 18 2019-10-16T14:22:03.796Z
// complete
// time: 3007.273ms



// > 返回值 res is undefined for AsyncParallelHook


// tapPromise注册事件
// console.time('time2');
// promiseParallelHook.tapPromise('21', (name, age) => {
// 	return new Promise((resolve, reject) => {
// 		setTimeout(() => {
// 			console.log('21', name, age, new Date());
// 			resolve('21');
// 		}, 1000);
// 	});
// });

// promiseParallelHook.tapPromise('22', (name, age) => {
// 	return new Promise((resolve, reject) => {
// 		setTimeout(() => {
// 			console.log('22', name, age, new Date());
// 			resolve('22');
// 		}, 2000);
// 	});
// });

// promiseParallelHook.tapPromise('23', (name, age) => {
// 	return new Promise((resolve, reject) => {
// 		setTimeout(() => {
// 			console.log('23', name, age, new Date());
// 			resolve('23');
// 			console.timeEnd('time2');
// 		}, 3000);
// 	});
// });

// // 触发事件，让监听函数执行
// promiseParallelHook.promise('panda', 18).then(res => {
// 	// res is undefined for AsyncParallelHook
// 	// 注意这里没有回调参数
// 	console.log('complete promise:', res);
// });


// NOTE: 如果同时使用 tapAsync 和 tapPromise 两种方式注册事件，调用时会执行所有注册的事件，不论哪种方式注册的
// 如果想避免这种干扰，可以在 AsyncParallelHook 的不同实例上注册事件

// 1 panda 18 2019-10-17T03:08:14.206Z
// 21 panda 18 2019-10-17T03:08:14.211Z
// 2 panda 18 2019-10-17T03:08:15.214Z
// 22 panda 18 2019-10-17T03:08:15.215Z
// 3 panda 18 2019-10-17T03:08:16.210Z
// complete cb: undefined undefined
// time1: 3008.421ms
// 23 panda 18 2019-10-17T03:08:16.211Z
// time2: 3007.178ms
// complete promise: undefined



// `AsyncParallelHook` 是通过循环，在执行每一个 task 时，都会检测是否满足条件执行 `callAsync` 的回调 `done` 函数，必须所有函数都完成了，才会满足调用条件。
// 如果中间某个事件处理函数没有调用 `done`，就不会满足 `done` 调用条件，即所有事件成功完成并调用 `done`，最终才会调用 `done`。

// 而 `AsyncSeriesHook` 的 `next` 执行机制更像 `Express` 和 `Koa` 中的中间件，在注册事件的回调中如果不调用 `next`，则在触发事件时会在没有调用 `next` 的事件处理函数的位置 “卡死”，即不会继续执行后面的事件处理函数，只有都调用 `next` 才能继续，而最后一个事件处理函数中调用 `next` 决定是否调用 `callAsync` 的回调。

class MockAsyncParallelHook {
	constructor(args) {
		this.args = args;
		this.tasks = [];
	}

	tabAsync(name, task) {
		this.tasks.push(task);
	}
	callAsync(...args) {
		// 先取出最后传入的回调函数
		const finalCallback = args.pop();

		// 传入参数严格对应创建实例传入数组中的规定的参数，执行时多余的参数为 undefined
		args = args.slice(0, this.args.length);

		// 定义一个 i 变量和 done 函数
		// 每次执行检测 i 值和队列长度，决定是否执行 callAsync 的回调函数
		let i = 0;
		const done = () => {
			if (++i === this.tasks.length) {
				finalCallback();
			}
		};

		// 依次执行事件处理函数
		this.tasks.forEach(task => task(...args, done));
	}

	tapPromise(name, task) {
		this.tasks.push(task);
	}
	promise(...args) {
		// 传入参数严格对应创建实例传入数组中的规定的参数，执行时多余的参数为 undefined
		args = args.slice(0, this.args.length);

		// 将所有事件处理函数转换成 Promise 实例，并发执行所有的 Promise
		return Promise.all(this.tasks.map(task => task(...args)));
	}
}

/**

// compile tapAsync 输出

parallel 并行输出:

// parallel 并行输出开始
do {
	var _counter = 3;
	var _done = () => {
		_callback();
	};
	if (_counter <= 0) break;
	var _fn0 = _x[0];
	_fn0(name, age, _err0 => {
		if (_err0) {
			if (_counter > 0) {
				_callback(_err0);
				_counter = 0;
			}
		} else {
			if (--_counter === 0) _done();
		}
	});
	if (_counter <= 0) break;
	var _fn1 = _x[1];
	_fn1(name, age, _err1 => {
		if (_err1) {
			if (_counter > 0) {
				_callback(_err1);
				_counter = 0;
			}
		} else {
			if (--_counter === 0) _done();
		}
	});
	if (_counter <= 0) break;
	var _fn2 = _x[2];
	_fn2(name, age, _err2 => {
		if (_err2) {
			if (_counter > 0) {
				_callback(_err2);
				_counter = 0;
			}
		} else {
			if (--_counter === 0) _done();
		}
	});
} while (false);

// parallel 并行输出结束



// compile tapPromise 输出

parallel 并行输出:
// TODO: 当和 tapAsync 同时执行时，这个数字变为 6，为什么 do {} 内变量没有作用域？
// 将所有 tasks一起编译生成了，所以为 6，并做了一定的合并，同时并行执行

// parallel 并行输出开始
do {
	var _counter = 3;
	var _done = () => {
		_resolve();
	};
	if (_counter <= 0) break;
	var _fn0 = _x[0];
	var _hasResult0 = false;
	var _promise0 = _fn0(name, age);
	if (!_promise0 || !_promise0.then)
		throw new Error(
			"Tap function (tapPromise) did not return promise (returned " +
				_promise0 +
				")"
		);
	_promise0.then(
		_result0 => {
			_hasResult0 = true;
			if (--_counter === 0) _done();
		},
		_err0 => {
			if (_hasResult0) throw _err0;
			if (_counter > 0) {
				_error(_err0);
				_counter = 0;
			}
		}
	);
	if (_counter <= 0) break;
	var _fn1 = _x[1];
	var _hasResult1 = false;
	var _promise1 = _fn1(name, age);
	if (!_promise1 || !_promise1.then)
		throw new Error(
			"Tap function (tapPromise) did not return promise (returned " +
				_promise1 +
				")"
		);
	_promise1.then(
		_result1 => {
			_hasResult1 = true;
			if (--_counter === 0) _done();
		},
		_err1 => {
			if (_hasResult1) throw _err1;
			if (_counter > 0) {
				_error(_err1);
				_counter = 0;
			}
		}
	);
	if (_counter <= 0) break;
	var _fn2 = _x[2];
	var _hasResult2 = false;
	var _promise2 = _fn2(name, age);
	if (!_promise2 || !_promise2.then)
		throw new Error(
			"Tap function (tapPromise) did not return promise (returned " +
				_promise2 +
				")"
		);
	_promise2.then(
		_result2 => {
			_hasResult2 = true;
			if (--_counter === 0) _done();
		},
		_err2 => {
			if (_hasResult2) throw _err2;
			if (_counter > 0) {
				_error(_err2);
				_counter = 0;
			}
		}
	);
} while (false);

// parallel 并行输出结束

*/






