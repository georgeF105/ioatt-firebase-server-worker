import { IRuleCondition } from './IRuleCondition';

export interface IRule {
  active: boolean;
  conditions: Array<IRuleCondition>;
  type: string;
  name: string;
  linkedDeviceKey: string;
}
