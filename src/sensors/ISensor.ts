import { SensorTypeEnum } from './SensorTypeEnum';
import { ISensorData } from './ISensorData';

export interface ISensor {
  auth?: any;
  key: string;
  type: string;
  data: ISensorData;
  lastUpdated: Date;
}
