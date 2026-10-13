'use strict';

const CSS_TAG = '<link rel="stylesheet" href="/ui-motion.css" data-hotel-motion-assets>';
const JS_TAG = '<script src="/ui-motion.js" defer data-hotel-motion-assets></script>';

function injectMotion(html) {
  if (typeof html !== 'string') throw new TypeError('html must be a string');
  if (html.includes('data-hotel-motion-assets')) return html;

  let output = html;
  if (/<\\/head\\s*>/i.test(output)) {
    output = output.replace(/<\\/head\\s*>/i, CSS_TAG + '\\n</head>');
  } else if (/<body\\b[^>]*>/i.test(output)) {
    output = output.replace(/<body\\b[^>]*>/i, match => match + '\\n' + CSS_TAG);
  } else {
    output = CSS_TAG + '\\n' + output;
  }

  if (/<\\/body\\s*>/i.test(output)) {
    output = output.replace(/<\\/body\\s*>/i, JS_TAG + '\\n</body>');
  } else if (/<\\/html\\s*>/i.test(output)) {
    output = output.replace(/<\\/html\\s*>/i, JS_TAG + '\\n</html>');
  } else {
    output += '\\n' + JS_TAG + '\\n';
  }
  return output;
}

module.exports = { injectMotion };
