// Location cascade data integrity (static regionsData used by AddressDropdown).
// Run: node --test test/locationData.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Load client ES module constants via dynamic import
async function loadRegions() {
  const mod = await import(
    pathToFileURL(path.join(__dirname, '..', '..', 'client', 'src', 'utils', 'constants.js')).href
  );
  return mod.regionsData;
}

function pathToFileURL(p) {
  const { pathToFileURL: toURL } = require('url');
  return toURL(p);
}

test('regionsData has 9 regions with many zones and woredas (not a tiny sample)', async () => {
  const regionsData = await loadRegions();
  const regionKeys = Object.keys(regionsData);
  assert.equal(regionKeys.length, 9);

  let zones = 0;
  let woredas = 0;
  for (const r of Object.values(regionsData)) {
    assert.ok(r.name);
    assert.ok(r.zones && typeof r.zones === 'object');
    for (const z of Object.values(r.zones)) {
      zones++;
      assert.ok(z.name);
      assert.ok(z.woredas && typeof z.woredas === 'object');
      const wCount = Object.keys(z.woredas).length;
      assert.ok(wCount >= 1, `zone ${z.name} should have at least 1 woreda`);
      woredas += wCount;
    }
  }
  // Previously ~14 zones / ~16 woredas — require substantial expansion
  assert.ok(zones >= 60, `expected >= 60 zones, got ${zones}`);
  assert.ok(woredas >= 300, `expected >= 300 woredas, got ${woredas}`);
});

test('Oromia exposes all major zones (not only East/West Shewa)', async () => {
  const regionsData = await loadRegions();
  const zoneNames = Object.values(regionsData.oromia.zones).map((z) => z.name);
  assert.ok(zoneNames.includes('East Shewa'));
  assert.ok(zoneNames.includes('Jimma'));
  assert.ok(zoneNames.includes('Arsi'));
  assert.ok(zoneNames.includes('Borena'));
  assert.ok(Object.keys(regionsData.oromia.zones).length >= 15);
});

test('cascading: selecting a region yields only its zones; zone yields its woredas', async () => {
  const regionsData = await loadRegions();
  const regionKey = 'amhara';
  const zones = regionsData[regionKey].zones;
  const zoneKey = Object.keys(zones)[0];
  const woredas = zones[zoneKey].woredas;
  assert.ok(Object.keys(zones).length > 1);
  assert.ok(Object.keys(woredas).length >= 1);
  // Child woreda names are non-empty strings
  for (const w of Object.values(woredas)) {
    assert.equal(typeof w.name, 'string');
    assert.ok(w.name.length > 0);
  }
});

test('AddressDropdown renders all Object.keys without slice/limit', () => {
  const src = fs.readFileSync(
    path.join(__dirname, '..', '..', 'client', 'src', 'components', 'common', 'AddressDropdown.jsx'),
    'utf8'
  );
  assert.doesNotMatch(src, /\.slice\s*\(/);
  assert.doesNotMatch(src, /limit\s*[:=]/);
  assert.match(src, /Object\.keys\(zones\)/);
  assert.match(src, /Object\.keys\(woredas\)/);
});

test('required exports still present for other modules', async () => {
  const mod = await import(
    pathToFileURL(path.join(__dirname, '..', '..', 'client', 'src', 'utils', 'constants.js')).href
  );
  assert.ok(Array.isArray(mod.paymentMethods));
  assert.ok(Array.isArray(mod.logisticsRegions));
  assert.ok(Array.isArray(mod.vehicleTypes));
  assert.ok(Array.isArray(mod.productUnits));
});
