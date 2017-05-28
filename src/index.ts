import 'dotenv/config';
import admin from './firebase/firebase.config';
import { SensorsService } from './sensors/sensors.service';
import { RulesService } from './rules/rules.service';

// tslint:disable-next-line:no-var-requires
let netatmo = require('netatmo');

let remoteSenors = [];
let rules = [];

const INTERVAL_TIME = 10000;

console.log('starting ioatt-firebase-server-worker');

let sensorService = new SensorsService(admin);
let rulesService = new RulesService(admin);

setInterval(updateAllThings, INTERVAL_TIME);

function updateAllThings() {
  sensorService.updateSensors();
  rulesService.updateRules();
}

// function recalculateRules() {
//     rules.forEach(rule => {
//         let calculatedValue = rule.conditions.reduce(calculateContionalCheck, true);
//         console.log('calculated Value', calculatedValue);
//     });
// }

// function calculateContionalCheck(previousValue, currentCondition) {
//     if (currentCondition) {
//         if (currentCondition.condionalOperator === 'or') {
//             return previousValue || calculateRuleType(currentCondition);
//         }

//         if (currentCondition.condionalOperator) {
//             return previousValue && calculateRuleType(currentCondition);
//         }
//         return previousValue && calculateRuleType(currentCondition);
//     }
//     return true;
// }

// function calculateRuleType(condition) {
//     if (condition.type === 'time') {
//         return calculateTimeCondition(condition);
//     }

//     if (condition.type === 'temperature') {
//         return calculateTemperatureCondition(condition);
//     }

//     return false;
// }

// function calculateTimeCondition(condition) {
//     let startTime = getDateFromTime(condition.startTime);
//     let endTime = getDateFromTime(condition.endTime);
//     let currentTime = Date.now();

//     return currentTime.valueOf() > startTime.valueOf() && currentTime.valueOf() < endTime.valueOf();
// }

// function calculateTemperatureCondition(condition) {
//     console.log('calculating temp condition', condition);

//     db.ref(`sensors/${condition.sensor}`).once('value')
//     .then(sensorRef => {
//         let sensor = sensorRef.val();
//         let valueToCheck = sensor.data[condition.sensorKey];
//         console.log('sensor valueToCheck', valueToCheck);
//     });
//     return true;
// }

// function getDateFromTime(time): Date {
//     let timeArr = time.split(':');
//     let date = new Date();
//     date.setHours(timeArr[0]);
//     date.setMinutes(timeArr[1]);
//     return date;
// }
