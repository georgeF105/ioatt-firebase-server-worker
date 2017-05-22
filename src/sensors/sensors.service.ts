import { ISensor } from './ISensor';
// tslint:disable-next-line:no-var-requires
let netatmo = require('netatmo');

const SENSORS = 'sensors';

export class SensorsService {
  private sensorsRef: Firebase;
  private sensors: Array<ISensor> = [];

  constructor (
    private firebaseAdmin
  ) {
    this.sensorsRef = firebaseAdmin.database().ref(SENSORS);
    this.sensorsRef.on('value', this.saveToSensors);
  }

  public updateSensors (): Promise<void> {
    return Promise.resolve();
  }

  private saveToSensors (sensorsSnapshot: FirebaseDataSnapshot): void {
    let sensorObjects = sensorsSnapshot.val();
    this.sensors = Object.keys(sensorObjects)
      .map(key => {
        let sensor = sensorObjects[key];
        sensor.key = key;
        return sensor;
      });
  }

  private fetchSensorData (): Promise<ISensor[]> {
    return Promise.all(this.sensors.map(sensor => {
      return new Promise((resolve, reject) => {
        let api = new netatmo(sensor.auth);
        api.getStationData((err, devices) => {
          if (!devices || err) {
            reject(err);
          }
          resolve(devices);
        });
      });
    }));
  }
}
