/* loglevel 本地轻量替身：只实现 dxf-parser 用到的接口，避免依赖外部包 */
const LEVELS = { trace: 0, debug: 1, info: 2, warn: 3, error: 4, silent: 5 };
let currentLevel = 'error';

function createLogger(name) {
  const api = {};
  ['trace', 'debug', 'info', 'warn', 'error'].forEach(function (method) {
    api[method] = function () {
      const cur = LEVELS[currentLevel] === undefined ? 4 : LEVELS[currentLevel];
      if (cur <= LEVELS[method]) {
        const fn = console[method] || console.log;
        try { fn.apply(console, arguments); } catch (e) { /* 忽略日志异常 */ }
      }
    };
  });
  api.setLevel = function (l) { if (typeof l === 'string' && LEVELS[l] !== undefined) currentLevel = l; };
  api.getLevel = function () { return currentLevel; };
  api.getLogger = function (n) { return createLogger(n); };
  api.enableAll = function () { currentLevel = 'trace'; };
  api.disableAll = function () { currentLevel = 'silent'; };
  api.noop = function () {};
  return api;
}

const log = createLogger();
export default log;
