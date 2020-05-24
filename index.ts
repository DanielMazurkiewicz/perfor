import { performance } from 'perf_hooks';
import * as fs from 'fs';


// === Types/Interfaces ===

type TestCallback = () => void
type TestMethod = (name: string, testCallback: TestCallback, minMeasureTimeInMs?: number) => void
type TestGroupCallback = (test: TestMethod) => void


type TestName = string
type TestGroupName = string
type TestGroupResults = Record<TestName, number>

interface TestRun {
    name?: string
    results: Record<TestGroupName, TestGroupResults>

    // ... all the data about test envirionment will go here ...

}

interface TestSettings {
    // Possible to provide a custom name fot test run (eg. pull request title)
    name?: string

    // path to a file where result will be stored
    storeToFile?: string

    // show results on console in textual form
    console?: boolean

    // console comparison file
    comparisonFile?: string

}

interface TestGroupToRun {
    name:               TestGroupName 
    testGroupCallback:  TestGroupCallback
}

type TestFile = Array<TestRun>;



// === Small file helpers methods ===

const readTestsFileCache: Record<string, TestFile> = {};
const readTestsFile = (filePath: string): TestFile => {
    if (readTestsFileCache[filePath]) return readTestsFileCache[filePath];
    let jsonContent: any;
    try {
        const textContent = fs.readFileSync(filePath, {encoding:'utf8', flag:'r'});
        jsonContent = JSON.parse(textContent);
    } catch (e) {
        jsonContent = [];
    }

    if (!Array.isArray(jsonContent)) // Some super basic test 
        throw new Error(`Not a valid file with test results: ${filePath}`)

    readTestsFileCache[filePath] = jsonContent;
    return jsonContent;
}

const addToTestsFile = (filePath: string, testRun: TestRun) => {
    const testFileContent = readTestsFile(filePath);
    testFileContent.push(testRun);
    fs.writeFileSync(filePath, JSON.stringify(testFileContent));
}


// === Code ===

let testRun: TestRun;


const getOpsPerSecFromMs = (timeInMs: number) => 1000 / timeInMs;
const getOpsPerSecText = (opePerSec: number) => opePerSec.toFixed(2) + ' ops/sec';


const measure = (callback: TestCallback, minMeasureTimeInMs: number) => {
    let numberOfTests = 1;
    let start: number, end: number, time: number;
    do {
        let i = 0;
        start = performance.now();
        for (; i < numberOfTests; i++) {
            callback();
        }
        end = performance.now();
        numberOfTests *= 2;
    } while ((time = (end - start)) < minMeasureTimeInMs)

    return (time / (numberOfTests / 2));
}

const testGroupRun = (groupName: TestGroupName, testGroupCallback: TestGroupCallback) => {
    const testGroupResults = (testRun.results[groupName] = testRun.results[groupName] || {});

    const test: TestMethod = (testName, testCallback, minMeasureTimeInMs = 500) => {
        let time = measure(testCallback, minMeasureTimeInMs);
        if (time <= 0) throw new Error(`Test ${testName} in group ${groupName} can't be performed due to impossible results`);

        if (testGroupResults[testName] !== undefined) 
            throw new Error(`Test ${testName} already exist in group ${groupName}`);

        testGroupResults[testName] = time;
    }

    testGroupCallback(test);
}

const getPercText = (value: number) => (value * 100).toFixed(2) + '%';
const printToConsole = (testRun: TestRun, testRunToCompareWith: TestRun) => {
    const { results: testRunResults } = testRun;
    const { results: toCompareResults } = testRunToCompareWith;

    for (let groupName in testRunResults) {
        console.log(groupName);
        const group = testRunResults[groupName];
        const groupToCompare = toCompareResults[groupName];
        if (groupToCompare) {
            for (let testName in group) {
                const testResultInMs = group[testName];
                const testResultInOpsPerSec = getOpsPerSecFromMs(testResultInMs);

                const testResultToCompareInMs = groupToCompare[testName];

                const textLine = '   * ' + testName + ': ' + getOpsPerSecText(testResultInOpsPerSec);

                if (testResultToCompareInMs === undefined) {
                    console.log(textLine);
                } else {
                    const testResultToCompareInOpsPerSec = getOpsPerSecFromMs(testResultToCompareInMs);
                    const differenceInOpsPerSec = testResultInOpsPerSec - testResultToCompareInOpsPerSec;
                    if (differenceInOpsPerSec > 0) {
                        console.log(textLine + 
                            ` (☺ faster by ${getPercText(differenceInOpsPerSec / testResultInOpsPerSec)})`)
                    } else if (differenceInOpsPerSec < 0) {
                        console.log(textLine + 
                            ` (☹ slower by ${getPercText(-differenceInOpsPerSec / testResultInOpsPerSec)})`)
                    } else {
                        console.log(textLine + ' (same performance)');
                    }
                }
            }
        } else {
            for (let testName in group) {
                const testResultInMs = group[testName];
                const testResultInOpsPerSec = getOpsPerSecFromMs(testResultInMs);
                console.log('   * ' + testName + ': ' + getOpsPerSecText(testResultInOpsPerSec))
            }    
        }
    }
}


const testGroupsToRun: Array<TestGroupToRun> = []

export const testGroup = (name: TestGroupName, testGroupCallback: TestGroupCallback) => {
    testGroupsToRun.push({name, testGroupCallback});
}

export const testStart = (settings: TestSettings) => {
    setTimeout(() => { // give GC some time - just an experiment
        testRun = {
            name: settings.name,
            results: {}
        };
    
        testGroupsToRun.forEach(({name, testGroupCallback}) => testGroupRun(name, testGroupCallback));
    
        if (settings.console) {
            if (settings.comparisonFile) {
                const fileContent = readTestsFile(settings.comparisonFile);
                if (fileContent.length) {
                    printToConsole(testRun, fileContent[fileContent.length - 1]);
                } else {
                    printToConsole(testRun, {results:{}}); // no comparison print
                }
            } else {
                printToConsole(testRun, {results:{}}); // no comparison print
            }
        }
    
        if (settings.storeToFile) {
            addToTestsFile(settings.storeToFile, testRun);
        }
    
    }, 10);

}
