var admin = require("firebase-admin");
var netatmo = require('netatmo');
var serviceAccount = require('./firebase-admin.key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://angle-control.firebaseio.com'
});

var remoteSenors = [];
var rules = [];

var db = admin.database();
var sensorsRef = db.ref('sensors');
var rulesRef = db.ref('rules');

console.log('starting ioatt-firebase-server-worker');

sensorsRef.on('value', sensorRefs => {
    let sensorsVal = sensorRefs.val();
    remoteSenors = Object.keys(sensorsVal)
        .map(key => {
            let sensor = sensorsVal[key];
            sensor.key = key;
            return sensor;
        })
        .filter(sensor => sensor.type === 'remote');    
});

rulesRef.on('value', ruleRefs => {
    let rulesVal = ruleRefs.val();
    rules = Object.keys(rulesVal)
        .map(key => {
            let rule = rulesVal[key];
            rule.key = key;
            return rule;
        });    
});

setTimeout(updateAllThings, 5000);

function updateAllThings() {
    updateSensors();
    recalculateRules();
}

function updateSensors() {
    remoteSenors.forEach(sensor => {
        getSensorData(sensor);
    })
}

function getSensorData(sensor) {
    var api = new netatmo(sensor.auth);
    api.getStationsData(function(err, devices) {
        let data = devices[0].dashboard_data;
        postSensorData(sensor.key, data);
    });
}

function postSensorData(key, data) {
    console.log('updating sensor data');
    db.ref(`sensors/${key}/data`).set(data);
}

function recalculateRules() {
    rules.forEach(rule => {
        calculatedValue = rule.conditions.reduce(calculateContionalCheck, true);
        console.log('calculated Value', calculatedValue);
    });
}

function calculateContionalCheck(previousValue, currentCondition) {
    if (currentCondition) {
        if (currentCondition.condionalOperator === 'or') {
            return previousValue || calculateRuleType(currentCondition);
        }

        if (currentCondition.condionalOperator) {
            return previousValue && calculateRuleType(currentCondition);
        }
        return previousValue && calculateRuleType(currentCondition);
    }
    return true;
}

function calculateRuleType(condition) {
    if (condition.type === 'time') {
        return calculateTimeCondition(condition);
    }

    if (condition.type === 'temperature') {
        return calculateTemperatureCondition(condition);
    }

    return false;
}

function calculateTimeCondition(condition) {
    let startTime = getDateFromTime(condition.startTime);
    let endTime = getDateFromTime(condition.endTime);
    let currentTime = Date.now();

    return currentTime > startTime && currentTime < endTime;
}

function calculateTemperatureCondition(condition) {
    console.log('calculating temp condition', condition);

    db.ref(`sensors/${condition.sensor}`).once('value')
    .then(sensorRef => {
        let sensor = sensorRef.val();
        let valueToCheck = sensor.data[condition.sensorKey];
        console.log('sensor valueToCheck', valueToCheck);
    })
    return true;
}

function getDateFromTime(time) {
    let timeArr = time.split(':');
    let date = new Date();
    date.setHours(timeArr[0]);
    date.setMinutes(timeArr[1]);
    return date;
}