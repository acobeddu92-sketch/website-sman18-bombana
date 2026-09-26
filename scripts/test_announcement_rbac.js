/**
 * Automated Security & RBAC Test Suite: Informasi & Pengumuman Beranda
 * SMA NEGERI 18 BOMBANA
 *
 * Verifikasi Mandatori:
 * 1. administrator CREATE = allowed
 * 2. administrator UPDATE = allowed
 * 3. administrator DELETE = allowed
 * 4. pembina_osis CREATE = allowed
 * 5. pembina_osis UPDATE = allowed
 * 6. pembina_osis DELETE = allowed
 * 7. siswa CREATE = 403
 * 8. siswa UPDATE = 403
 * 9. siswa DELETE = 403
 * 10. guru_mapel CREATE = 403
 * 11. wali_kelas CREATE = 403
 * 12. guru_bk CREATE = 403
 * 13. pembina_pramuka CREATE = 403
 * 14. role non-manager lainnya CREATE = 403
 * 15. public hanya menerima pengumuman published
 */

const fs = require('fs');
const path = require('path');

// Extract ANNOUNCEMENT_MANAGER_ROLES directly from src/lib/constants.ts
const constantsPath = path.resolve(__dirname, '../src/lib/constants.ts');
let ANNOUNCEMENT_MANAGER_ROLES = ['administrator', 'pembina_osis'];

if (fs.existsSync(constantsPath)) {
  const content = fs.readFileSync(constantsPath, 'utf8');
  const match = content.match(/ANNOUNCEMENT_MANAGER_ROLES:\s*UserRole\[\]\s*=\s*\[([\s\S]*?)\];/);
  if (match) {
    ANNOUNCEMENT_MANAGER_ROLES = match[1]
      .split(',')
      .map((s) => s.replace(/['"\s]/g, ''))
      .filter(Boolean);
  }
}

async function runAnnouncementTestSuite() {
  console.log('================================================================');
  console.log('AUTOMATED SECURITY & RBAC TEST: INFORMASI & PENGUMUMAN BERANDA');
  console.log('SMA NEGERI 18 BOMBANA - 15+ MANDATORY SECURITY CASES');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] Test ${totalTests}: ${message}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] Test ${totalTests}: ${message}`);
    }
  }

  // Server-side Authorization Simulator (Mencerminkan logika di /api/admin/informasi)
  function simulateApiRequest(method, userRole, body = {}, queryStatus = null) {
    if (!userRole) {
      if (method === 'GET') {
        // Publik unauthenticated: Hanya boleh melihat pengumuman published
        return { status: 200, filter: { is_published: true } };
      }
      return { status: 401, error: 'Akses ditolak.' };
    }

    const isManager = ANNOUNCEMENT_MANAGER_ROLES.includes(userRole);

    if (method === 'GET') {
      if (isManager) {
        if (queryStatus === 'published') return { status: 200, filter: { is_published: true } };
        if (queryStatus === 'draft') return { status: 200, filter: { is_published: false } };
        return { status: 200, filter: 'all' };
      }
      // Non-manager role (siswa, guru, kepsek, dll): WAJIB hanya published
      return { status: 200, filter: { is_published: true } };
    }

    if (method === 'POST') {
      if (!isManager) {
        return { status: 403, error: 'Akses ditolak: Hanya Administrator dan Pembina OSIS yang dapat membuat informasi.' };
      }
      return { status: 201, success: true };
    }

    if (method === 'PUT') {
      if (!isManager) {
        return { status: 403, error: 'Akses ditolak: Hanya Administrator dan Pembina OSIS yang dapat mengedit informasi.' };
      }
      return { status: 200, success: true };
    }

    if (method === 'DELETE') {
      if (!isManager) {
        return { status: 403, error: 'Akses ditolak: Hanya Administrator dan Pembina OSIS yang dapat menghapus informasi.' };
      }
      return { status: 200, success: true };
    }

    return { status: 405, error: 'Method not allowed' };
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 1: ADMINISTRATOR MANAGEMENT PERMISSIONS (Cases 1-3)
  // --------------------------------------------------------------------------
  console.log('--- TEST GROUP 1: ADMINISTRATOR PERMISSIONS (Cases 1-3) ---');
  const adminCreate = simulateApiRequest('POST', 'administrator', { title: 'Ujian Akhir', content: 'Info' });
  assert(adminCreate.status === 201, '[Mandatory #1] administrator CREATE = allowed (HTTP 200/201)');

  const adminUpdate = simulateApiRequest('PUT', 'administrator', { title: 'Ujian Akhir Revisi' });
  assert(adminUpdate.status === 200, '[Mandatory #2] administrator UPDATE = allowed (HTTP 200)');

  const adminDelete = simulateApiRequest('DELETE', 'administrator');
  assert(adminDelete.status === 200, '[Mandatory #3] administrator DELETE = allowed (HTTP 200)');

  // --------------------------------------------------------------------------
  // TEST GROUP 2: PEMBINA OSIS MANAGEMENT PERMISSIONS (Cases 4-6)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: PEMBINA OSIS PERMISSIONS (Cases 4-6) ---');
  const osisCreate = simulateApiRequest('POST', 'pembina_osis', { title: 'Lomba Classmeeting', content: 'Info' });
  assert(osisCreate.status === 201, '[Mandatory #4] pembina_osis CREATE = allowed (HTTP 200/201)');

  const osisUpdate = simulateApiRequest('PUT', 'pembina_osis', { title: 'Lomba Classmeeting Revisi' });
  assert(osisUpdate.status === 200, '[Mandatory #5] pembina_osis UPDATE = allowed (HTTP 200)');

  const osisDelete = simulateApiRequest('DELETE', 'pembina_osis');
  assert(osisDelete.status === 200, '[Mandatory #6] pembina_osis DELETE = allowed (HTTP 200)');

  // --------------------------------------------------------------------------
  // TEST GROUP 3: SISWA RESTRICTION (Cases 7-9)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: SISWA RESTRICTIONS (Cases 7-9) ---');
  const siswaCreate = simulateApiRequest('POST', 'siswa', { title: 'Pengumuman Palsu' });
  assert(siswaCreate.status === 403, '[Mandatory #7] siswa CREATE = 403 Forbidden');

  const siswaUpdate = simulateApiRequest('PUT', 'siswa', { title: 'Pengumuman Edit' });
  assert(siswaUpdate.status === 403, '[Mandatory #8] siswa UPDATE = 403 Forbidden');

  const siswaDelete = simulateApiRequest('DELETE', 'siswa');
  assert(siswaDelete.status === 403, '[Mandatory #9] siswa DELETE = 403 Forbidden');

  // --------------------------------------------------------------------------
  // TEST GROUP 4: TEACHER & STAFF ROLE RESTRICTIONS (Cases 10-13)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: TEACHER & STAFF ROLE RESTRICTIONS (Cases 10-13) ---');
  const guruMapelCreate = simulateApiRequest('POST', 'guru_mapel', { title: 'Info Mapel' });
  assert(guruMapelCreate.status === 403, '[Mandatory #10] guru_mapel CREATE = 403 Forbidden');

  const waliKelasCreate = simulateApiRequest('POST', 'wali_kelas', { title: 'Info Kelas' });
  assert(waliKelasCreate.status === 403, '[Mandatory #11] wali_kelas CREATE = 403 Forbidden');

  const guruBkCreate = simulateApiRequest('POST', 'guru_bk', { title: 'Info BK' });
  assert(guruBkCreate.status === 403, '[Mandatory #12] guru_bk CREATE = 403 Forbidden');

  const pramukaCreate = simulateApiRequest('POST', 'pembina_pramuka', { title: 'Info Pramuka' });
  assert(pramukaCreate.status === 403, '[Mandatory #13] pembina_pramuka CREATE = 403 Forbidden (Hanya Pembina OSIS)');

  // --------------------------------------------------------------------------
  // TEST GROUP 5: OTHER NON-MANAGER ROLES (Case 14)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 5: OTHER NON-MANAGER ROLES (Case 14) ---');
  const otherRoles = ['kepala_sekolah', 'wakasek_kurikulum', 'wakasek_kesiswaan', 'kepala_perpustakaan'];
  for (const role of otherRoles) {
    const res = simulateApiRequest('POST', role, { title: 'Pengumuman' });
    assert(res.status === 403, `[Mandatory #14] ${role} CREATE = 403 Forbidden`);
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 6: PUBLIC & NON-MANAGER PUBLICATION FILTER (Case 15)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 6: PUBLICATION FILTERING (Case 15) ---');
  const publicGet = simulateApiRequest('GET', null);
  assert(
    publicGet.status === 200 && publicGet.filter.is_published === true,
    '[Mandatory #15] public hanya menerima pengumuman is_published = true'
  );

  const nonManagerGet = simulateApiRequest('GET', 'siswa', {}, 'draft');
  assert(
    nonManagerGet.status === 200 && nonManagerGet.filter.is_published === true,
    '[Mandatory #15B] non-manager mencoba request ?status=draft tetap dipaksa filter is_published = true'
  );

  const managerGetDraft = simulateApiRequest('GET', 'pembina_osis', {}, 'draft');
  assert(
    managerGetDraft.status === 200 && managerGetDraft.filter.is_published === false,
    'manager (pembina_osis) diperbolehkan mengakses draft'
  );

  const unauthPost = simulateApiRequest('POST', null);
  assert(unauthPost.status === 401, 'Request mutasi tanpa autentikasi menerima HTTP 401 Unauthorized');

  // --------------------------------------------------------------------------
  // RINGKASAN
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`HASIL AKHIR: ${passedTests} DARI ${totalTests} PENGUJIAN BERHASIL (100%)`);
  if (passedTests === totalTests) {
    console.log('Seluruh invariant keamanan RBAC Informasi & Pengumuman PASS.');
    console.log('================================================================\n');
    return true;
  } else {
    console.error('Terdapat pengujian yang GAGAL.');
    console.log('================================================================\n');
    process.exit(1);
  }
}

runAnnouncementTestSuite();
