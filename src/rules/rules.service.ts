import { IRule } from './IRule';
import { SENSORS_REF } from '../sensors/sensors.service';
import { IRuleCondition } from './IRuleCondition';
const RULES_REF = 'rules';

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
    return Promise.all(this.rules.map(rule => this.calculateRuleAndUpdateDevice(rule)))
      .then(() => undefined);
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
    return this.firebaseAdmin.database().ref(`devices/${rule.linkedDeviceKey}`).update(updates);
  }

  private calculateConditionsConditionally (previousValuePromise: Promise<boolean>, currentCondition: IRuleCondition): Promise<boolean> {
    let currentConditionPromise = currentCondition ? this.calculateConditionState(currentCondition) : Promise.resolve(true);
    return Promise.all([previousValuePromise, currentConditionPromise])
      .then(([previousValue, currentConditionValue]) => {
        if (!currentCondition) {
          return Promise.resolve(true);
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
        return Promise.reject('cant find logical operator type');
      });
  }

  private calculateConditionState (condition: IRuleCondition): Promise<boolean> {
    if (condition.type === 'time') {
        return this.calculateTimeCondition(condition);
    }

    if (condition.type === 'temperature') {
        return this.calculateTemperatureCondition(condition);
    }
    return Promise.resolve(false);
  }

  private calculateTimeCondition (condition: IRuleCondition): Promise<boolean> {
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

  private calculateTemperatureCondition (condition: IRuleCondition): Promise<boolean> {
    return this.fetchSensorData(condition.sensorKey, condition.sensorDataKey)
      .then(sensorData => {
        return condition.value < sensorData;
      });
  }

  private fetchSensorData (sensorKey: string, sensorDataKey: string): Promise<number> {
    return this.firebaseAdmin.database().ref(`${SENSORS_REF}/${sensorKey}/data/${sensorDataKey}`).once('value')
      .then(dataSnapshot => dataSnapshot.val());
  }
}
