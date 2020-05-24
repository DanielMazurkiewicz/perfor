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
    storeToFile: './testResults.json',
    console: true,
    comparisonFile: './testResults.json'
})
```