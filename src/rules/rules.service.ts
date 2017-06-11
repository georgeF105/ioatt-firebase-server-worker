import { IRule } from './IRule';
import { SENSORS_REF } from '../sensors/sensors.service';
import { IRuleCondition } from './IRuleCondition';
import { ITimeRuleCondition } from './ITimeRuleCondition';
import { ITemperatureRuleCondition } from './ITemperatureRuleCondition';
import { IWeekDayRuleCondition } from './IWeekDayRuleCondition';
const RULES_REF = 'rules';

enum weekDayEnum {
  sunday = 0,
  monday = 1,
  tuesday = 2,
  wednesday = 3,
  thursday = 4,
  friday = 5,
  saturday = 6
}

export class RulesService {
  private rulesRef: Firebase;
  private rules: Array<IRule> = [];

  constructor (
    private firebaseAdmin
  ) {
    this.rulesRef = firebaseAdmin.database().ref(RULES_REF);
    this.rulesRef.on('value', (rulesSnapshot) => this.saveRulesSnapshot(rulesSnapshot));
  }

  public updateRules (): Promise<void> {
    return Promise.all(this.rules.map(rule => {
        if (!rule.active) {
          return Promise.resolve();
        }
        return this.calculateRuleAndUpdateDevice(rule);
      }))
      .then(() => undefined);
  }

  private onRulesUpdate (rulesSnapshot: FirebaseDataSnapshot): void {
    this.saveRulesSnapshot(rulesSnapshot);
    this.updateRules();
  }

  private saveRulesSnapshot (rulesSnapshot: FirebaseDataSnapshot): void {
    let ruleObjects = rulesSnapshot.val();
    this.rules = Object.keys(ruleObjects)
      .map(key => {
        let rule = ruleObjects[key];
        rule.key = key;
        return rule;
      });
    this.updateRules();
  }

  private calculateRuleAndUpdateDevice (rule: IRule): Promise<void> {
    return this.calculateRuleCondition(rule)
      .then(state => this.updateLinkedDeviceState(rule, state));
  }

  private calculateRuleCondition (rule: IRule): Promise<boolean> {
    return rule.conditions.reduce((previous, current) => this.calculateConditionsConditionally(previous, current), Promise.resolve(true));
  }

  private updateLinkedDeviceState (rule: IRule, state: boolean): Promise<void> {
    console.log('setting', rule.linkedDeviceKey, 'to', state);
    let updates = {};
    updates['/state'] = state;
    updates['/updatedByHost'] = true;
    updates['/updatedByDevice'] = false;
    return this.firebaseAdmin.database().ref(`devices/${rule.linkedDeviceKey}`).update(updates);
  }

  private calculateConditionsConditionally (previousValuePromise: Promise<boolean>, currentCondition: IRuleCondition): Promise<boolean> {
    let currentConditionPromise = currentCondition ? this.calculateConditionState(currentCondition) : Promise.resolve(true);
    return Promise.all([previousValuePromise, currentConditionPromise])
      .then(([previousValue, currentConditionValue]) => {
        if (!currentCondition) {
          return true;
        }
        if (currentCondition.logicOperator === 'or') {
          return previousValue || currentConditionValue;
        }
        if (currentCondition.logicOperator === 'and') {
          return previousValue && currentConditionValue;
        }
        if (currentCondition.logicOperator === 'xor') {
          return previousValue || !currentConditionValue;
        }
        if (currentCondition.logicOperator === 'xand') {
          return previousValue && !currentConditionValue;
        }
        throw('cant find logical operator type');
      });
  }

  private calculateConditionState (condition: IRuleCondition): Promise<boolean> {
    if (condition.type === 'time') {
      return this.calculateTimeCondition(<ITimeRuleCondition>condition);
    }

    if (condition.type === 'temperature') {
      return this.calculateTemperatureCondition(<ITemperatureRuleCondition>condition);
    }

    if (condition.type === 'weekDay') {
      return this.calculateWeekDayCondition(<IWeekDayRuleCondition>condition);
    }
    return Promise.resolve(false);
  }

  private calculateTimeCondition (condition: ITimeRuleCondition): Promise<boolean> {
    let startTime = this.getDateFromTime(condition.startTime);
    let endTime = this.getDateFromTime(condition.endTime);
    let currentTime = Date.now();
    return Promise.resolve(currentTime.valueOf() > startTime.valueOf() && currentTime.valueOf() < endTime.valueOf());
  }
  private getDateFromTime (time: string): Date {
    let timeArr = time.split(':');
    let date = new Date();
    date.setHours(parseInt(timeArr[0]));
    date.setMinutes(parseInt(timeArr[1]));
    return date;
  }

  private calculateTemperatureCondition (condition: ITemperatureRuleCondition): Promise<boolean> {
    return this.fetchSensorData(condition.sensorKey, condition.sensorDataKey)
      .then(sensorData => {
        return condition.value > sensorData;
      });
  }

  private fetchSensorData (sensorKey: string, sensorDataKey: string): Promise<number> {
    return this.firebaseAdmin.database().ref(`${SENSORS_REF}/${sensorKey}/data/${sensorDataKey}`).once('value')
      .then(dataSnapshot => dataSnapshot.val());
  }

  private calculateWeekDayCondition (condition: IWeekDayRuleCondition): Promise<boolean> {
    let weekDay: weekDayEnum = this.getCurrentWeekDay();
    let state: boolean;
    switch (weekDay) {
      case weekDayEnum.monday:
        state = condition.monday;
        break;
      case weekDayEnum.tuesday:
        state = condition.tuesday;
        break;
      case weekDayEnum.wednesday:
        state = condition.wednesday;
        break;
      case weekDayEnum.thursday:
        state = condition.thursday;
        break;
      case weekDayEnum.friday:
        state = condition.friday;
        break;
      case weekDayEnum.saturday:
        state = condition.saturday;
        break;
      case weekDayEnum.sunday:
        state = condition.sunday;
        break;
      default:
        state = false;
    }
    return Promise.resolve(state);
  }

  private getCurrentWeekDay(): weekDayEnum {
    let date = new Date();
    return date.getDay();
  }
}
