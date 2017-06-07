import 'dotenv/config';
import admin from './firebase/firebase.config';
import { SensorsService } from './sensors/sensors.service';
import { RulesService } from './rules/rules.service';

// tslint:disable-next-line:no-var-requires
let netatmo = require('netatmo');

let remoteSenors = [];
let rules = [];

const INTERVAL_TIME = 5 * 60 * 1000; // every 5 mins

console.log('starting ioatt-firebase-server-worker');

let sensorService = new SensorsService(admin);
let rulesService = new RulesService(admin);

setInterval(updateAllThings, INTERVAL_TIME);

function updateAllThings() {
  sensorService.updateSensors();
  rulesService.updateRules();
}
