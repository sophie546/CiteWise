// /api/v1/synthesis  – RAG intro drafting via n8n + draft persistence
// Ports DraftGenerationController.java + RAGSynthesisService.java + SynthesisN8nClient.java

import express from 'express';
import fetch   from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import supabase from '../../common/config/supabaseClient.js';

const router = express.Router();

// Source tier logic (port of RAGSynthesisService.determineSourceTier)
function determineSourceTier(insight) {
  const overall    = insight?.overall_score ?? null;
  const rec        = insight?.recommendation_status ?? null;
  const rel        = insight?.relevance_level ?? null;
  const mismatchJson = insight?.mismatch_flags_json ?? '';

  const hasMismatch = mismatchJson.toUpperCase().includes('TOPIC_MISMATCH');

  if ((overall !== null && overall < 40) || rec === 'Low Relevance' || rel === 'Low' || hasMismatch) return 'EXCLUDED';
  if ((overall !== null && overall >= 75) || rec === 'Recommended' || rel === 'High') return 'CORE';
  if ((overall !== null && overall >= 60 && overall < 75) || rec === 'Needs Review' || rel === 'Medium') return 'SUPPORTING';
  if (overall !== null && overall >= 40 && overall < 60) return 'TANGENTIAL';
  return 'SUPPORTING';
}

const TIER_META = {
  CORE:       { payloadValue: 'Core Source',       guidance: 'Use as main synthesis evidence.' },
  SUPPORTING: { payloadValue: 'Supporting Source', guidance: 'Use cautiously as supporting evidence.' },
  TANGENTIAL: { payloadValue: 'Tangential Source', guidance: 'Do not center the generated introduction on this source; use only for broad background if needed.' },
  EXCLUDED:   { payloadValue: 'Excluded Source',   guidance: 'Do not include this document text as synthesis evidence.' },
};

// Simple citation metadata from filename (mirrors CitationMetadataExtractor minimal logic)
function extractCitationFromFilename(filename, text) {
  const name = (filename ?? '').replace(/\.pdf$/i, '').trim();
  // Try "Authors (Year) Title" or "Title_Year" patterns
  const yearMatch = name.match(/[\b_\s(](\d{4})[\b_\s)]/);
  const year   = yearMatch?.[1] ?? null;
  // Try to extract title: strip common author-name patterns
  const title  = name.replace(/_/g, ' ').replace(/\(\d{4}\)/, '').trim() || null;
  return { author: null, authorDisplay: null, authors: [], year, title, journal: '', volume: '', issue: '',
    pages: '', doi: '', url: '', arxivId: '', publisher: '', sourceType: 'document', metadataReliable: false, warnings: [] };
}

function parseJsonArray(str) {
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed.map(v => typeof v === 'string' ? v : JSON.stringify(v)) : [];
  } catch { return []; }
}

// POST /api/v1/synthesis/generate?sessionId=...&chosenGap=...
router.post('/generate', async (req, res) => {
  const sessionId = req.query.sessionId;
  const chosenGap = req.query.chosenGap ?? null;

  if (!sessionId) return res.status(400).json({ success: false, message: 'sessionId is required', data: null });

  // Load baseline
  const { data: baselines } = await supabase
    .from('research_baselines').select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false }).limit(1);
  const baseline = baselines?.[0] ?? null;
  if (!baseline) console.warn(`[synthesis] no baseline for session ${sessionId}`);

  // Load approved documents with text
  const { data: approvedDocs, error: docsErr } = await supabase
    .from('uploaded_documents').select('*')
    .eq('session_id', sessionId).eq('approved', true);
  if (docsErr) return res.status(500).json({ success: false, message: docsErr.message });

  const docsWithText = (approvedDocs ?? []).filter(d => d.parsed_text?.trim());
  if (!docsWithText.length) {
    return res.json({ success: false, message: 'Approve at least one document before generating an introduction.' });
  }

  // Load insights + determine tiers
  const tieredDocs = await Promise.all(docsWithText.map(async (doc) => {
    const { data: insight } = await supabase.from('document_insights').select('*').eq('document_id', doc.id).maybeSingle();
    const { data: excerpts } = insight
      ? await supabase.from('evidence_excerpts').select('*').eq('document_insight_id', insight.id).order('display_order')
      : { data: [] };
    const fullInsight = insight ? { ...insight, evidenceExcerpts: excerpts ?? [] } : null;
    const tier = determineSourceTier(fullInsight);
    return { doc, insight: fullInsight, tier };
  }));

  const usableDocs = tieredDocs.filter(d => d.tier !== 'EXCLUDED');
  if (!usableDocs.length) {
    return res.json({
      success: false,
      status:  'NO_RELEVANT_SOURCES',
      message: 'No sufficiently relevant approved sources are available for synthesis. Review approved documents in Module 2.',
      meta: { approvedDocumentCount: docsWithText.length, excludedSourceCount: tieredDocs.length },
    });
  }

  // Build n8n payload
  const gapsRaw = baseline?.research_gaps;
  const gapsArray = Array.isArray(gapsRaw) ? gapsRaw : (gapsRaw ? [gapsRaw] : []);

  const payload = {
    sessionId,
    synthesisInstructions:
      'The CATalyst Title, Rationale, and Research Gap are the primary source of truth. '
      + 'Approved documents are supplementary. Use Core Sources as the main evidence, '
      + 'Supporting Sources cautiously, Tangential Sources only for brief background, '
      + 'and Excluded Sources not at all. Do not let a low-relevance approved document redirect the topic. '
      + 'The primaryFocusGap is the user\'s selected gap and should be treated as the main structural narrative pivot. '
      + 'The remaining gaps provide supporting context.',
    baseline: {
      title:     baseline?.project_title ?? '',
      rationale: baseline?.rationale     ?? '',
      gaps:      gapsArray,
      ...(chosenGap?.trim() ? { primaryFocusGap: chosenGap.trim(), chosenGap: chosenGap.trim() } : {}),
    },
    sourceTierSummary: {
      core:       usableDocs.filter(d => d.tier === 'CORE').length,
      supporting: usableDocs.filter(d => d.tier === 'SUPPORTING').length,
      tangential: usableDocs.filter(d => d.tier === 'TANGENTIAL').length,
    },
    approvedDocuments: usableDocs.map(({ doc, insight, tier }) => {
      const meta = extractCitationFromFilename(doc.file_name, doc.parsed_text);
      const excerpts = (insight?.evidenceExcerpts ?? []).map(e => ({
        quoteText:     e.quote_text,
        pageNumber:    e.page_number,
        relevanceLevel:e.relevance_level,
        criterion:     e.criterion,
        evidenceType:  e.evidence_type,
        displayOrder:  e.display_order,
      }));
      const scores = {
        gapAlignment:  insight?.gap_alignment_score ?? null,
        methodology:   insight?.methodology_score    ?? null,
        theory:        insight?.theoretical_score    ?? null,
        citationQuality:insight?.citation_score      ?? null,
        overall:        insight?.overall_score        ?? null,
      };
      return {
        documentId:          String(doc.id),
        filename:            doc.file_name ?? '',
        extracted_text:      doc.parsed_text,
        sourceTier:          TIER_META[tier].payloadValue,
        sourceUseGuidance:   TIER_META[tier].guidance,
        overallScore:        insight?.overall_score         ?? null,
        recommendationStatus:insight?.recommendation_status ?? null,
        confidenceLevel:     insight?.confidence_level       ?? null,
        relevanceLevel:      insight?.relevance_level         ?? null,
        mismatchFlagsJson:   insight?.mismatch_flags_json  ?? '[]',
        weaknessFlagsJson:   insight?.weakness_flags_json  ?? '[]',
        mismatchFlags:       parseJsonArray(insight?.mismatch_flags_json),
        weaknessFlags:       parseJsonArray(insight?.weakness_flags_json),
        scores,
        evidenceExcerpts: excerpts,
        metadata: meta,
      };
    }),
  };

  const webhookUrl = process.env.CITEWISE_N8N_SYNTHESIS_WEBHOOK_URL
    || 'http://localhost:5678/webhook/citewise-synthesizer-v2';

  let n8nData;
  try {
    const n8nRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Connection: 'close' },
      body:    JSON.stringify(payload),
      timeout: parseInt(process.env.CITEWISE_N8N_READ_TIMEOUT_MS) || 120000,
    });
    const raw = await n8nRes.text();
    if (!raw?.trim()) throw new Error('Synthesis webhook returned empty response');
    let root = JSON.parse(raw);
    if (Array.isArray(root) && root.length) root = root[0];
    for (const f of ['output','body','data','json','result']) {
      if (root[f] && typeof root[f] === 'object') { root = root[f]; break; }
      if (root[f] && typeof root[f] === 'string') { try { root = JSON.parse(root[f]); break; } catch {} }
    }
    n8nData = root;
  } catch (err) {
    console.error('[synthesis] n8n call failed:', err.message);
    return res.status(502).json({ success: false, message: `Synthesis failed: ${err.message}` });
  }

  const contentText   = n8nData.contentText   ?? '';
  const referencesText= n8nData.referencesText ?? '';
  const success       = n8nData.success        !== false;
  const message       = n8nData.message        ?? '';
  const validationStatus = n8nData.validationStatus ?? '';
  const validationFlags  = Array.isArray(n8nData.validationFlags) ? n8nData.validationFlags : [];

  if (!success || (validationStatus && validationStatus.toUpperCase() !== 'PASSED')) {
    return res.json({
      success:    false,
      status:     validationStatus || 'VALIDATION_FAILED',
      message:    message || 'Synthesis failed or validation failed',
      validationFlags,
      retryRecommended: n8nData.retryRecommended ?? false,
      errorMessage:     n8nData.errorMessage     ?? null,
    });
  }

  // Persist draft – replace any previous draft for this session
  await supabase.from('generated_draft').delete().eq('session_id', sessionId);

  const { data: draft, error: draftErr } = await supabase
    .from('generated_draft').insert({
      session_id:                  sessionId,
      content_text:                contentText,
      references_text:             referencesText,
      background_text:             n8nData.sections?.background    ?? null,
      rationale_text:              n8nData.sections?.rationale     ?? null,
      gap_text:                    n8nData.sections?.gap           ?? null,
      citations_used_json:         n8nData.citationsUsed ? JSON.stringify(n8nData.citationsUsed) : '[]',
      validation_status:           n8nData.validationStatus        ?? null,
      validation_flags_json:       n8nData.validationFlags ? JSON.stringify(n8nData.validationFlags) : '[]',
      unsupported_claim_flags_json:n8nData.unsupportedClaimFlags ? JSON.stringify(n8nData.unsupportedClaimFlags) : '[]',
      metrics_json:                n8nData.metrics ? JSON.stringify(n8nData.metrics) : '{}',
    }).select().single();

  if (draftErr) {
    console.error('[synthesis] failed to save draft:', draftErr.message);
    return res.status(500).json({ success: false, message: draftErr.message });
  }

  return res.json({
    draftId:        draft.id,
    sessionId,
    contentText,
    referencesText,
    sections:       n8nData.sections    ?? null,
    citationsUsed:  n8nData.citationsUsed ?? [],
    validationStatus: draft.validation_status,
    validationFlags,
    metrics:        n8nData.metrics ?? null,
    createdAt:      draft.created_at,
    success:        true,
    message,
  });
});

// GET /api/v1/synthesis/export?draftId=...&format=txt
router.get('/export', async (req, res) => {
  const { draftId, format = 'txt' } = req.query;
  if (!draftId) return res.status(400).json({ message: 'draftId is required' });

  const { data: draft } = await supabase.from('generated_draft').select('*').eq('id', draftId).maybeSingle();
  if (!draft) return res.status(404).end();

  let content = draft.content_text ?? '';
  if (draft.references_text?.trim()) content += '\n\nReferences\n' + draft.references_text;

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="draft_${draftId}.${format.toLowerCase()}"`);
  return res.send(Buffer.from(content, 'utf8'));
});

export default router;
