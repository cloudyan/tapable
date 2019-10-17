// 我们可以给小程序的生命周期加入 hooks 功能

// app lifecycle : onLaunch onShow onHide onError onPageNotFound
// page lifecycle: onLoad onShow onReady onHide onUnload
//     onPullDownRefresh onReachBottom onPageScroll onResize
//     onShareAppMessage onTabItemTap

// The best practice is to expose all hooks of a class in a `hooks` property:

const {
  SyncHook,
  SyncBailHook,
  SyncWaterfallHook,
  SyncLoopHook,
  AsyncParallelHook,
  AsyncParallelBailHook,
  AsyncSeriesHook,
  AsyncSeriesBailHook,
  AsyncSeriesWaterfallHook
} = require('../lib');

// 小程序改写生命周期，添加以下方法（大多是同步方法）
// App 加入以下方法
mini.App.hooks.onLaunch.call('before', options)
// Page 加入以下方法
mini.Page.hooks.onLoad.call('before', query)

// 使用
mini.App.hooks.onLaunch.tap('before', options => {

})
mini.Page.hooks.onLoad.tap('before', options => {

})
mini.Page.hooks.onShow.tap('before', options => {
  // tongji.pv()
})

