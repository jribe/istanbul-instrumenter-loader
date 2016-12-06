'use strict';

var istanbulLibInstrument = require('istanbul-lib-instrument');
var loaderUtils = require('loader-utils');
var assign = require('object-assign');
var sourceMap = require('source-map');

function concatenateSourceMaps(sourceMaps) {
  var firstMap = new sourceMap.SourceMapConsumer(sourceMaps[0]);
  var generator = sourceMap.SourceMapGenerator.fromSourceMap(firstMap);
  for (var i = 1; i < sourceMaps.length; i++) {
    var nextMap = new sourceMap.SourceMapConsumer(sourceMaps[i]);
    generator.applySourceMap(nextMap);
  }
  return generator.toJSON();
}

module.exports = function(source, inputSourceMap) {
    var userOptions = loaderUtils.parseQuery(this.query);
    var instrumenter = istanbulLibInstrument.createInstrumenter(
        assign({ produceSourceMap: this.sourceMap }, userOptions)
    );

    if (this.cacheable) {
        this.cacheable();
    }

    var instrumenterSourceMap = userOptions.noInputSourceMap ? undefined : inputSourceMap;
    var that = this;
    return instrumenter.instrument(source, this.resourcePath, function (error, source) {
        var outputSourceMap;
        if (userOptions.noInputSourceMap && that.sourceMap) {
          outputSourceMap = concatenateSourceMaps([instrumenter.lastSourceMap(), inputSourceMap]);
        } else {
          outputSourceMap = instrumenter.lastSourceMap();
        }
        that.callback(error, source, outputSourceMap);
    }, instrumenterSourceMap);
};
