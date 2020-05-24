import { testStart } from '../index';
import './testsGroup1';

testStart({ 
    storeToFile: './testResults.json',
    console: true,
    comparisonFile: './testResults.json'
})