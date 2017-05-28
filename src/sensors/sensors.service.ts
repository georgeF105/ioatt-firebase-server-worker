import { ISensor } from './ISensor';
import { ISensorData } from './ISensorData';
import { SensorTypeEnum } from './SensorTypeEnum';

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
    this.sensorsRef.on('value', (sensorSnapshot) => this.saveSensorSnapshot(sensorSnapshot));
  }

  public updateSensors (): Promise<void> {
    return this.fetchSensorData(this.sensors)
      .then(sensors => {
        return sensors;
      })
      .then(sensors => this.postSensorData(sensors));
  }

  private saveSensorSnapshot (sensorsSnapshot: FirebaseDataSnapshot): void {
    let sensorObjects = sensorsSnapshot.val();
    this.sensors = Object.keys(sensorObjects)
      .map(key => {
        let sensor = sensorObjects[key];
        sensor.key = key;
        return sensor;
      });
  }

  private fetchSensorData (sensors: ISensor[]): Promise<ISensor[]> {
    return Promise.all(sensors.map(sensor => {
      if (sensor.type === SensorTypeEnum[SensorTypeEnum.netatmo]) {
        return this.fetchNetatmoSendorData(sensor);
      }
      return Promise.resolve(sensor);
    }));
  }

  private fetchNetatmoSendorData (sensor: ISensor): Promise<ISensor> {
    return new Promise((res, rej) => {
      let api = new netatmo(sensor.auth);
      api.getStationsData((err, devices) => {
          if (!devices || err) {
            rej(err);
          }
          sensor.data = devices[0].dashboard_data;
          sensor.lastUpdated = new Date();
          res(sensor);
        });
    });
  }

  private postSensorData (sensors: ISensor[]): Promise<void> {
    return Promise.all(sensors.map(sensor => {
      let updates = {};
      updates['/data'] = sensor.data;
      updates['/lastUpdated'] = sensor.lastUpdated;
      return this.firebaseAdmin.database().ref(`sensors/${sensor.key}`).update(updates);
    }))
    .then(() => undefined);
  }
}
