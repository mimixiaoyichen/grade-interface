import { describe, expect, it } from 'vitest';
import buildExportJson from '../utils/buildExportJson';
import {
  createProblemCharacteristicsData,
  parseImportedProblemCharacteristics,
  toggleSingleSelect
} from '../utils/problemCharacteristics';

describe('problem characteristics helpers', () => {
  it('normalizes singular answers to at most one selection', () => {
    const data = createProblemCharacteristicsData({
      q1: ['Low: Rare or occasional occurrence', 'High: Occurs frequently or as a persistent issue'],
      q2: ['Urgent: Requires immediate resolution', 'Schedulable: Needs attention but can be planned in advance'],
      q3: ['Continuous: Ongoing and persistent', 'Discrete: One-time or event-based'],
      q4: ['Promotion: Achieve growth, improvement, or gain', 'Maintenance: Sustain or stabilize an existing state'],
      q5: ['High: Significant consequences (e.g., financial, legal, medical, or identity-related impact)', 'Low: Limited consequences; minimal disruption to livelihood or well-being'],
      q6: 'Discovery notes'
    });

    expect(data.q1).toEqual(['Low: Rare or occasional occurrence']);
    expect(data.q2).toEqual(['Urgent: Requires immediate resolution']);
    expect(data.q3).toEqual(['Continuous: Ongoing and persistent']);
    expect(data.q4).toEqual(['Promotion: Achieve growth, improvement, or gain']);
    expect(data.q5).toEqual(['High: Significant consequences (e.g., financial, legal, medical, or identity-related impact)']);
    expect(data.q6).toEqual('Discovery notes');
  });

  it('toggles a single option on and off', () => {
    expect(toggleSingleSelect([], 'A')).toEqual(['A']);
    expect(toggleSingleSelect(['A'], 'B')).toEqual(['B']);
    expect(toggleSingleSelect(['A'], 'A')).toEqual([]);
  });

  it('exports only one value per singular question', () => {
    const json = buildExportJson({
      problemCharacteristics: {
        q1: ['Low', 'High'],
        q2: ['Deferrable', 'Urgent'],
        q3: ['Continuous', 'Discrete'],
        q4: ['Prevention', 'Promotion'],
        q5: ['Low', 'High'],
        q6: 'Discovery notes'
      }
    });
    const payload = JSON.parse(json);

    expect(payload.problem_characteristics).toEqual({
      information_intensity: ['Low'],
      frequency: ['Deferrable'],
      stakes: ['Continuous'],
      expert_dependency: ['Prevention'],
      emotional_valence: ['Low'],
      problem_discovery: 'Discovery notes'
    });
  });

  it('parses the current export schema into questionnaire state', () => {
    const imported = parseImportedProblemCharacteristics({
      information_intensity: ['High'],
      frequency: ['Recurring'],
      stakes: ['High'],
      expert_dependency: ['Expert-present'],
      emotional_valence: ['Aversive'],
      problem_discovery: 'Found it through repeated customer calls'
    });

    expect(imported.rawLegacy).toBeNull();
    expect(imported.data).toEqual({
      q1: ['High'],
      q2: ['Recurring'],
      q3: ['High'],
      q4: ['Expert-present'],
      q5: ['Aversive'],
      q6: 'Found it through repeated customer calls'
    });
  });

  it('preserves legacy exports without forcing them into the new schema', () => {
    const legacyBlock = {
      frequency: ['Recurring'],
      urgency: ['Urgent'],
      temporal_frame: ['Continuous'],
      barrier_types: ['Access & Structural'],
      goal_orientation: ['Promotion'],
      stakes: ['High']
    };
    const imported = parseImportedProblemCharacteristics(legacyBlock);

    expect(imported.rawLegacy).toEqual(legacyBlock);
    expect(imported.data).toEqual({
      q1: [],
      q2: ['Recurring'],
      q3: ['High'],
      q4: [],
      q5: [],
      q6: ''
    });
  });

  it('falls back to the raw legacy block when no new questionnaire answers exist', () => {
    const legacyBlock = {
      frequency: ['Recurring'],
      urgency: ['Urgent'],
      temporal_frame: ['Continuous'],
      barrier_types: ['Access & Structural'],
      goal_orientation: ['Promotion'],
      stakes: ['High']
    };
    const json = buildExportJson({
      problemCharacteristics: createProblemCharacteristicsData(null),
      problemCharacteristicsRaw: legacyBlock
    });
    const payload = JSON.parse(json);

    expect(payload.problem_characteristics).toEqual(legacyBlock);
  });
});
