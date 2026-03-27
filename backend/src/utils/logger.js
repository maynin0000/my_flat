// src/utils/logger.js
const LOG_LEVELS = { info: '📘', warn: '⚠️', error: '❌', success: '✅' };

function formatMessage(level, message) {
  const time = new Date().toLocaleTimeString('ko-KR');
  return `${LOG_LEVELS[level]} [${time}] ${message}`;
}

const logger = {
  info: (msg) => console.log(formatMessage('info', msg)),
  warn: (msg) => console.warn(formatMessage('warn', msg)),
  error: (msg) => console.error(formatMessage('error', msg)),
  success: (msg) => console.log(formatMessage('success', msg)),
};

module.exports = logger;
