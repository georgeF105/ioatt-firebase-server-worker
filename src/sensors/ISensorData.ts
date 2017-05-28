export interface ISensorData {
  AbsolutePressure?: number;
  CO2?: number;
  Humidity?: number;
  Noise?: number;
  Pressure?: number;
  Temperature?: number;
  date_max_temp?: Date;
  date_min_temp?: Date;
  max_temp?: number;
  min_temp?: number;
  pressure_trend?: 'up' | 'down';
  temp_trend?: 'up' | 'down';
  time_utc?: Date;
}
