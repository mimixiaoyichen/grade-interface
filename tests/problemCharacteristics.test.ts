import { describe, expect, it } from 'vitest';
import buildExportJson from '../utils/buildExportJson';
import {
  createProblemCharacteristicsData,
  toggleSingleSelect
} from '../utils/problemCharacteristics';

describe('problem characteristics helpers', () => {
  it('normalizes singular answers to at most one selection', () => {
    const data = createProblemCharacteristicsData({
      q1: ['Low: Rare or occasional occurrence', 'High: Occurs frequently or as a persistent issue'],
      q2: ['Urgent: Requires immediate resolution', 'Schedulable: Needs attention but can be planned in advance'],
      q3: ['Continuous: Ongoing and persistent', 'Discrete: One-time or event-based'],
      q4: { 'Access & Structural': 'present', Empty: '' },
      q5: ['Promotion: Achieve growth, improvement, or gain', 'Maintenance: Sustain or stabilize an existing state'],
      q6: ['High: Significant consequences (e.g., financial, legal, medical, or identity-related impact)', 'Low: Limited consequences; minimal disruption to livelihood or well-being']
    });

    expect(data.q1).toEqual(['Low: Rare or occasional occurrence']);
    expect(data.q2).toEqual(['Urgent: Requires immediate resolution']);
    expect(data.q3).toEqual(['Continuous: Ongoing and persistent']);
    expect(data.q4).toEqual({ 'Access & Structural': 'present' });
    expect(data.q5).toEqual(['Promotion: Achieve growth, improvement, or gain']);
    expect(data.q6).toEqual(['High: Significant consequences (e.g., financial, legal, medical, or identity-related impact)']);
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
        q4: { Internal: 'present' },
        q5: ['Prevention', 'Promotion'],
        q6: ['Low', 'High']
      }
    });
    const payload = JSON.parse(json);

    expect(payload.problem_characteristics).toEqual({
      frequency: ['Low'],
      urgency: ['Deferrable'],
      temporal_frame: ['Continuous'],
      barrier_types: ['Internal'],
      goal_orientation: ['Prevention'],
      stakes: ['Low']
    });
  });
});
