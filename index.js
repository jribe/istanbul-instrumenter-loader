'use strict';

var istanbulLibInstrument = require('istanbul-lib-instrument');
var loaderUtils = require('loader-utils');
var assign = require('object-assign');
var path = require('path');
var fs = require('fs-extra');
var clone = require('clone');

module.exports = function(source, inputSourceMap) {
    var userOptions = loaderUtils.parseQuery(this.query);
    var instrumenter = istanbulLibInstrument.createInstrumenter(
        assign({ produceSourceMap: this.sourceMap }, userOptions)
    );

    if (this.cacheable) {
        this.cacheable();
    }

    var localSourceMap = clone(inputSourceMap);
    var resourcePath = this.resourcePath;
    if (userOptions.inputCacheDirectory !== undefined) {
      var inputCacheDirectory = path.resolve(userOptions.inputCacheDirectory);
      var cacheSourceFilename = path.resolve(path.join(inputCacheDirectory, this.resourcePath));
      var cacheSource = source;

      fs.ensureDirSync(path.dirname(cacheSourceFilename));
      if (this.sourceMap) {
        var cacheSourceMapFilename = `${cacheSourceFilename}.map`
        localSourceMap.file = cacheSourceFilename;

        fs.writeJsonSync(cacheSourceMapFilename, localSourceMap);
        cacheSource = cacheSource + `//# sourceMappingURL=${path.basename(cacheSourceMapFilename)}\n`;
      }
      fs.writeFileSync(cacheSourceFilename, cacheSource);
      resourcePath = cacheSourceFilename;
    }

    var that = this;
    return instrumenter.instrument(source, resourcePath, function (error, source) {
        var outputSourceMap = instrumenter.lastSourceMap();
        if (userOptions.inputCacheDirectory !== undefined && that.sourceMap) {
          outputSourceMap.file = that.resourcePath;
          outputSourceMap.sources = [
            that.resourcePath
          ];
        }
        that.callback(error, source, outputSourceMap);
    }, localSourceMap);
};
