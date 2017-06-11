export interface IRuleCondition {
  linkedDeviceKey: string;
  type: 'temperature' | 'time' | 'weekDay';
  logicOperator: 'or' | 'and' | 'xor' | 'xand';
}
