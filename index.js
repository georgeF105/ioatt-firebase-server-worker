var admin = require("firebase-admin");

var serviceAccount = require('./firebase-admin.key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://angle-control.firebaseio.com'
});

var senors;

var db = admin.database();
var sensorsRef = db.ref('sensors');

sensorsRef.on('value', sensorRefs => {
    let sensorsVal =sensorRefs.val();
    sensors = Object.keys(sensorsVal).map(sensor => sensorsVal[sensor]);
    console.log('sensors', sensors);
})