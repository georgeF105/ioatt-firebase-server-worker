var admin = require("firebase-admin");
var netatmo = require('netatmo');
var serviceAccount = require('./firebase-admin.key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://angle-control.firebaseio.com'
});

var remoteSenors = [];

var db = admin.database();
var sensorsRef = db.ref('sensors');

console.log('starting ioatt-firebase-server-worker');

sensorsRef.on('value', sensorRefs => {
    let sensorsVal =sensorRefs.val();
    remoteSenors = Object.keys(sensorsVal)
        .map(key => {
            let sensor = sensorsVal[key];
            sensor.key = key;
            return sensor;
        })
        .filter(sensor => sensor.type === 'remote');
    updateSensors();
    
});

function updateSensors() {
    remoteSenors.forEach(sensor => {
        getSensorData(sensor);
    })
}

function getSensorData(sensor) {
    var api = new netatmo(sensor.auth);
    api.getStationsData(function(err, devices) {
        let data = devices[0].dashboard_data;
        console.log('devices', devices);
        postSensorData(sensor.key, data);
    });
}

function postSensorData(key, data) {
    console.log('posting data', data, 'to', key);
    db.ref(`sensors/${key}/data`).set(data);
}