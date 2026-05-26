import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zdbaymktrzsmzimwdeua.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYmF5bWt0cnpzbXppbXdkZXVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDAxNTQsImV4cCI6MjA5MTQxNjE1NH0.-NONMuk3lkeL0HTiJtPBNEU3F33Y4dOIb1Iv7_K2Ykw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function uploadPhoto(file, inspectionId, itemId) {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${inspectionId}/${itemId}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('retail-inspection-photos')
    .upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage
    .from('retail-inspection-photos')
    .getPublicUrl(path);
  return data.publicUrl;
}

export async function saveInspection({ storeNumber, date, signature, comments, score, answers, textFields, photos }) {
  const { data: inspection, error: inspErr } = await supabase
    .from('retail_inspections')
    .insert({
      store_number: storeNumber || null,
      date: date || null,
      inspector_signature: signature || null,
      comments: comments || null,
      score_pct: score.pct,
      score_grade: score.grade,
      correct_count: score.correct,
      total_count: score.total,
    })
    .select('id')
    .single();

  if (inspErr) throw inspErr;

  const itemRows = Object.entries(answers)
    .filter(([, answer]) => answer === 'yes' || answer === 'no')
    .map(([itemId, answer]) => ({
      inspection_id: inspection.id,
      item_id: itemId,
      section_id: itemId.split('_').slice(0, -1).join('_'),
      answer,
      text_value: textFields[itemId] || null,
      photo_url: photos[itemId] || null,
    }));

  if (itemRows.length > 0) {
    const { error: itemsErr } = await supabase
      .from('retail_inspection_items')
      .insert(itemRows);
    if (itemsErr) throw itemsErr;
  }

  return inspection.id;
}

export async function fetchAllInspections() {
  const { data, error } = await supabase
    .from('retail_inspections')
    .select('id, store_number, date, inspector_signature, score_grade, score_pct, correct_count, total_count, comments, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function deleteInspection(id) {
  await supabase.from('retail_inspection_items').delete().eq('inspection_id', id);
  const { error } = await supabase.from('retail_inspections').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchInspection(id) {
  const { data: inspection, error } = await supabase
    .from('retail_inspections')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;

  const { data: items, error: itemsErr } = await supabase
    .from('retail_inspection_items')
    .select('*')
    .eq('inspection_id', id);
  if (itemsErr) throw itemsErr;

  return { inspection, items };
}

// ── Stores ──────────────────────────────────────────────────────────────────

export async function fetchStores() {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('store_number');
  if (error) throw error;
  return data;
}

export async function upsertStore({ id, store_number, name, address, lat, lng, dm_name }) {
  const row = { store_number, name: name || null, address: address || null, lat: lat || null, lng: lng || null, dm_name: dm_name || null };
  if (id) {
    const { error } = await supabase.from('stores').update(row).eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('stores').insert(row);
    if (error) throw error;
  }
}

export async function deleteStore(id) {
  const { error } = await supabase.from('stores').delete().eq('id', id);
  if (error) throw error;
}

export async function geocodeAddress(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  const data = await res.json();
  if (!data.length) throw new Error('Address not found');
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}
