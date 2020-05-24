"use strict";
exports.__esModule = true;
exports.testStart = exports.testGroup = void 0;
var perf_hooks_1 = require("perf_hooks");
var fs = require("fs");
// === Small file helpers methods ===
var readTestsFileCache = {};
var readTestsFile = function (filePath) {
    if (readTestsFileCache[filePath])
        return readTestsFileCache[filePath];
    var jsonContent;
    try {
        var textContent = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' });
        jsonContent = JSON.parse(textContent);
    }
    catch (e) {
        jsonContent = [];
    }
    if (!Array.isArray(jsonContent)) // Some super basic test 
        throw new Error("Not a valid file with test results: " + filePath);
    readTestsFileCache[filePath] = jsonContent;
    return jsonContent;
};
var addToTestsFile = function (filePath, testRun) {
    var testFileContent = readTestsFile(filePath);
    testFileContent.push(testRun);
    fs.writeFileSync(filePath, JSON.stringify(testFileContent));
};
// === Code ===
var testRun;
var getOpsPerSecFromMs = function (timeInMs) { return 1000 / timeInMs; };
var getOpsPerSecText = function (opePerSec) { return opePerSec.toFixed(2) + ' ops/sec'; };
var measure = function (callback, minMeasureTimeInMs) {
    var numberOfTests = 1;
    var start, end, time;
    do {
        var i = 0;
        start = perf_hooks_1.performance.now();
        for (; i < numberOfTests; i++) {
            callback();
        }
        end = perf_hooks_1.performance.now();
        numberOfTests *= 2;
    } while ((time = (end - start)) < minMeasureTimeInMs);
    return (time / (numberOfTests / 2));
};
var testGroupRun = function (groupName, testGroupCallback) {
    var testGroupResults = (testRun.results[groupName] = testRun.results[groupName] || {});
    var test = function (testName, testCallback, minMeasureTimeInMs) {
        if (minMeasureTimeInMs === void 0) { minMeasureTimeInMs = 500; }
        var time = measure(testCallback, minMeasureTimeInMs);
        if (time <= 0)
            throw new Error("Test " + testName + " in group " + groupName + " can't be performed due to impossible results");
        if (testGroupResults[testName] !== undefined)
            throw new Error("Test " + testName + " already exist in group " + groupName);
        testGroupResults[testName] = time;
    };
    testGroupCallback(test);
};
var getPercText = function (value) { return (value * 100).toFixed(2) + '%'; };
var printToConsole = function (testRun, testRunToCompareWith) {
    var testRunResults = testRun.results;
    var toCompareResults = testRunToCompareWith.results;
    for (var groupName in testRunResults) {
        console.log(groupName);
        var group = testRunResults[groupName];
        var groupToCompare = toCompareResults[groupName];
        if (groupToCompare) {
            for (var testName in group) {
                var testResultInMs = group[testName];
                var testResultInOpsPerSec = getOpsPerSecFromMs(testResultInMs);
                var testResultToCompareInMs = groupToCompare[testName];
                var textLine = '   * ' + testName + ': ' + getOpsPerSecText(testResultInOpsPerSec);
                if (testResultToCompareInMs === undefined) {
                    console.log(textLine);
                }
                else {
                    var testResultToCompareInOpsPerSec = getOpsPerSecFromMs(testResultToCompareInMs);
                    var differenceInOpsPerSec = testResultInOpsPerSec - testResultToCompareInOpsPerSec;
                    if (differenceInOpsPerSec > 0) {
                        console.log(textLine +
                            (" (\u263A faster by " + getPercText(differenceInOpsPerSec / testResultInOpsPerSec) + ")"));
                    }
                    else if (differenceInOpsPerSec < 0) {
                        console.log(textLine +
                            (" (\u2639 slower by " + getPercText(-differenceInOpsPerSec / testResultInOpsPerSec) + ")"));
                    }
                    else {
                        console.log(textLine + ' (same performance)');
                    }
                }
            }
        }
        else {
            for (var testName in group) {
                var testResultInMs = group[testName];
                var testResultInOpsPerSec = getOpsPerSecFromMs(testResultInMs);
                console.log('   * ' + testName + ': ' + getOpsPerSecText(testResultInOpsPerSec));
            }
        }
    }
};
var testGroupsToRun = [];
exports.testGroup = function (name, testGroupCallback) {
    testGroupsToRun.push({ name: name, testGroupCallback: testGroupCallback });
};
exports.testStart = function (settings) {
    setTimeout(function () {
        testRun = {
            name: settings.name,
            results: {}
        };
        testGroupsToRun.forEach(function (_a) {
            var name = _a.name, testGroupCallback = _a.testGroupCallback;
            return testGroupRun(name, testGroupCallback);
        });
        if (settings.console) {
            if (settings.comparisonFile) {
                var fileContent = readTestsFile(settings.comparisonFile);
                if (fileContent.length) {
                    printToConsole(testRun, fileContent[fileContent.length - 1]);
                }
                else {
                    printToConsole(testRun, { results: {} }); // no comparison print
                }
            }
            else {
                printToConsole(testRun, { results: {} }); // no comparison print
            }
        }
        if (settings.storeToFile) {
            addToTestsFile(settings.storeToFile, testRun);
        }
    }, 10);
};
