# perfor
Javascript/Typescript performance tests


# Installation
```sh
yarn add perfor --dev
```

# Usage

File "testGroup1.ts" (or "testGroup1.js")
```javascript
import { testGroup } from 'perfor';

testGroup('Performance test group #1', (test) => {
    test('Performance test #1', () => {
        // your code to test its performance here
    });

    test('Performance test #2', () => {
        // your code to test its performance here
    });
});
```

File "testsRun.ts" (or "testsRun.js")
```javascript
import { testStart } from 'perfor';;
import './testsGroup1';

testStart({ 
    // if provided then test result will be stored to given file
    storeToFile: './testResults.json',

    // if provided then test results will be printed to console
    console: true,

    // if provided then printed to console results will contain comparison with last stored test result in given file
    comparisonFile: './testResults.json'
})
```

# How it works

Each test is executed in loop for at least half a second, if you find results not precise enough you can change a minimum execution time like this:
```javascript
import { testGroup } from 'perfor';

testGroup('Performance test group #2', (test) => {
    test('Performance test #1', () => {
        // your code to test its performance here
    }, 1000); // <- test will run for at least one second (1000ms)
});
```

# Testing tips

For test results to be comparable between each tests run:
* Turn off all kind of dynamic frequency management and all sorts of "frequency boosts" of your processor
* Set fixed low frequency of your processor to avoid any sort of throttling
* Always run tests on exactly same machine configuration

Alternatively - run tests in software VM with fake real time clock where time is corelated with number of executed instructions for example (and not at all with a real time)