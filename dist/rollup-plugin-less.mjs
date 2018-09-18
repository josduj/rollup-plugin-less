import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
import fs from 'fs-extra';
import 'path';
import less from 'less';
import { createFilter } from 'rollup-pluginutils';

/*
 * create a style tag and append to head tag
 * @params {String} css style
 */

function insertStyle(css) {
    if (!css) return;

    if (typeof window == 'undefined') return;
    var style = document.createElement('style');
    style.setAttribute('media', 'screen');

    style.innerHTML = css;
    document.head.appendChild(style);
    return css;
}

var renderSync = function renderSync(code, option) {
				// https://github.com/less/less.js/issues/2325
				var css = void 0;
				option.syncImport = true;
				less.render(code, option, function (err, output) {
								if (err) throw err;
								css = output.css;
				});
				return css;
};

var fileCount = 0;

function plugin() {
				var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

				options.insert = options.insert || false;
				var filter = createFilter(options.include || ['**/*.less', '**/*.css'], options.exclude || 'node_modules/**');

				var injectFnName = '__$styleInject';
				return {
								name: 'less',
								intro: function intro() {
												return options.insert ? insertStyle.toString().replace(/insertStyle/, injectFnName) : '';
								},
								transform: function transform(code, id) {
												if (!filter(id)) {
																return null;
												}
												fileCount++;

												options.option = options.option || {};
												options.option['filename'] = id;
												options.output = options.output || 'rollup.build.css';
												if (options.plugins) {
																options.option['plugins'] = options.plugins;
												}

												var css = renderSync(code, options.option);

												if (options.output && isFunc(options.output)) {
																css = options.output(css, id);
												}

												if (options.output && isString(options.output)) {
																if (fileCount == 1) {
																				//clean the output file
																				fs.removeSync(options.output);
																}
																fs.appendFileSync(options.output, css);
												}

												var exportCode = '';

												if (options.insert != false) {
																exportCode = 'export default ' + injectFnName + '(' + _JSON$stringify(css.toString()) + ');';
												} else {
																exportCode = 'export default ' + _JSON$stringify(css.toString()) + ';';
												}
												return {
																code: exportCode,
																map: { mappings: '' }
												};
								}
				};
};

function isString(str) {
				if (typeof str == 'string') {
								return true;
				} else {
								return false;
				}
}

function isFunc(fn) {
				if (typeof fn == 'function') {
								return true;
				} else {
								return false;
				}
}

export default plugin;