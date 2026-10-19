/* 微信小游戏入口。共享经营逻辑不依赖 DOM。 */
const Core = require('./src/core.js');
const View = require('./src/view.js');
const Platform = require('./src/platform.js');
const App = require('./src/app.js');
App.start(Core, View, Platform.wechat());
