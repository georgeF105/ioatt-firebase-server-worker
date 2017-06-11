import { IRuleCondition } from './IRuleCondition';
import { IWeekDayRuleCondition } from './IWeekDayRuleCondition';
import { ITemperatureRuleCondition } from './ITemperatureRuleCondition';
import { ITimeRuleCondition } from './ITimeRuleCondition';

export interface IRule {
  active: boolean;
  conditions: Array<ITemperatureRuleCondition | ITimeRuleCondition | IWeekDayRuleCondition>;
  type: string;
  name: string;
  linkedDeviceKey: string;
}
