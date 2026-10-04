import {describe,it,expect} from 'vitest';
import {BudgetGuard,DEFAULT_LIMITS,LimitFailure,CancelledFailure} from '../src/index.js';
describe('fixed operation budgets',()=>{
 it('accepts cap and rejects cap+1 without allocating a large input',()=>{
  const guard=new BudgetGuard({nowMs:()=>0});
  guard.checkCount('maxCfgNodes',DEFAULT_LIMITS.maxCfgNodes,'LIMIT_CFG','lower');
  expect(()=>guard.checkCount('maxCfgNodes',DEFAULT_LIMITS.maxCfgNodes+1,'LIMIT_CFG','lower')).toThrow(LimitFailure);
  expect(()=>guard.checkCount('maxSlots',-1,'LIMIT_SLOTS','lower')).toThrow(RangeError);
 });
 it('checks deadline exactly at the approved time',()=>{
  let time=0;const guard=new BudgetGuard({nowMs:()=>time});
  time=9_999;guard.checkpoint('lex',true);time=10_000;
  expect(()=>guard.checkpoint('lex',true)).toThrow(LimitFailure);
 });
 it('checks every 256 units and supports a forced boundary check',()=>{
  let time=0;const guard=new BudgetGuard({nowMs:()=>time});time=10_001;
  for(let i=0;i<255;i++)guard.checkpoint('parse');
  expect(()=>guard.checkpoint('parse')).toThrow(LimitFailure);
 });
 it('has a separate execution deadline and structured cancellation',()=>{
  let time=0;const guard=new BudgetGuard({nowMs:()=>time},'execution');time=1000;
  expect(()=>guard.checkpoint('runtime',true)).toThrow(LimitFailure);
  const cancelled=new BudgetGuard({nowMs:()=>0,checkpointAbort:()=>true});
  expect(()=>cancelled.checkpoint('validate',true)).toThrow(CancelledFailure);
 });
 it('does not expose configurable higher release limits',()=>{
  expect(Object.isFrozen(DEFAULT_LIMITS)).toBe(true);
  expect(new BudgetGuard({nowMs:()=>0}).limits).toBe(DEFAULT_LIMITS);
 });
});
