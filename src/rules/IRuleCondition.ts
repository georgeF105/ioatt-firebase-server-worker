export interface IRuleCondition {
  sensorKey?: string;
  sensorDataKey?: string;
  type: string;
  value?: number;
  logicOperator: 'or' | 'and' | 'xor' | 'xand';
  startTime?: string;
  endTime?: string;
}
