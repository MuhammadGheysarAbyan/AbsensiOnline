    // ═══════════════════════ DATA STORE ═══════════════════════
    const DB = {
      users: [
        { id: 1, name: 'Administrator', email: 'admin@demo.com', nip: 'ADM001', dept: 'IT Department', role: 'admin', password: 'demo', active: true },
        { id: 2, name: 'Budi Santoso', email: 'budi@demo.com', nip: '2024001', dept: 'XII RPL 1', role: 'user', password: 'demo', active: true },
        { id: 3, name: 'Siti Rahma', email: 'siti@demo.com', nip: '2024002', dept: 'XII RPL 1', role: 'user', password: 'demo', active: true },
        { id: 4, name: 'Andi Wijaya', email: 'andi@demo.com', nip: '2024003', dept: 'XII TKJ 2', role: 'user', password: 'demo', active: true },
        { id: 5, name: 'Dewi Kusuma', email: 'dewi@demo.com', nip: '2024004', dept: 'XII TKJ 2', role: 'user', password: 'demo', active: true },
        { id: 6, name: 'Reza Pratama', email: 'reza@demo.com', nip: '2024005', dept: 'XII MM 1', role: 'user', password: 'demo', active: false },
      ],
      attendance: [],
      qrCodes: [],
      settings: { checkin: '08:00', checkout: '17:00', tolerance: 15, gps: 'off', radius: 100, lat: -6.2, lng: 106.8 },
      nextId: 200
    };

    function genMockData() {
      const today = new Date(); DB.attendance = [];
      let id = 1;
      DB.users.filter(u => u.role === 'user').forEach(user => {
        for (let i = 13; i >= 0; i--) {
          const d = new Date(today); d.setDate(d.getDate() - i);
          if (d.getDay() === 0 || d.getDay() === 6) continue;
          if (Math.random() < 0.08) continue;
          const lm = Math.random() < 0.2 ? Math.floor(Math.random() * 40) + 1 : 0;
          const [h, m] = DB.settings.checkin.split(':').map(Number);
          const inM = (m + lm) % 60, inH = h + Math.floor((m + lm) / 60);
          const ci = `${String(inH).padStart(2, '0')}:${String(inM).padStart(2, '0')}`;
          const isToday = d.toDateString() === today.toDateString();
          const co = isToday && Math.random() < 0.6 ? null : `${String(h + 8 + Math.floor(Math.random() * 2)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
          DB.attendance.push({ id: id++, userId: user.id, userName: user.name, userNip: user.nip, userDept: user.dept, date: d.toISOString().split('T')[0], checkin: ci, checkout: co, status: lm > DB.settings.tolerance ? 'telat' : 'hadir', qrToken: 'DEMO', late: lm });
        }
      });
    }
    genMockData();

    // ═══════════════════════ SESSION ═══════════════════════
    let CU = null, idleT, warnT;
    const IDLE_WARN = 5 * 60 * 1000, IDLE_OUT = 6 * 60 * 1000;

    function doLogin() {
      const email = document.getElementById('login-email').value.trim();
      const pass = document.getElementById('login-pass').value;
      const role = document.getElementById('login-role').value;
      if (!email || !pass) { notif('error', 'Error', 'Email dan password wajib!'); return; }
      const user = DB.users.find(u => (u.email === email || u.nip === email) && u.role === role && u.active);
      if (!user) { notif('error', 'Login Gagal', 'Akun tidak ditemukan atau tidak aktif!'); return; }
      CU = { ...user };
      sessionStorage.setItem('qr_session', JSON.stringify({ uid: user.id, role: user.role }));
      startIdle(); initApp();
      notif('success', 'Selamat Datang!', `Halo ${user.name} 👋`);
    }

    function doRegister() {
      const n = el('reg-name').value.trim(), em = el('reg-email').value.trim();
      const nip = el('reg-nip').value.trim(), dept = el('reg-dept').value.trim();
      const pass = el('reg-pass').value;
      if (!n || !em || !nip || !pass) { notif('error', 'Error', 'Semua field wajib diisi!'); return; }
      if (pass.length < 8) { notif('error', 'Error', 'Password minimal 8 karakter!'); return; }
      if (DB.users.find(u => u.email === em || u.nip === nip)) { notif('error', 'Error', 'Email/NIP sudah terdaftar!'); return; }
      DB.users.push({ id: ++DB.nextId, name: n, email: em, nip, dept, role: 'user', password: 'demo', active: true });
      notif('success', 'Berhasil', 'Akun berhasil dibuat! Silakan login.');
      showAuthPage('page-login');
    }

    function doLogout() {
      stopCamera(); CU = null;
      sessionStorage.removeItem('qr_session');
      clearTimeout(idleT); clearTimeout(warnT);
      el('app-shell').classList.remove('active'); el('app-shell').style.display = 'none';
      showAuthPage('page-login');
      notif('info', 'Logout', 'Anda telah keluar dari sistem.');
    }

    function startIdle() {
      const reset = () => {
        clearTimeout(idleT); clearTimeout(warnT);
        el('idle-w').style.display = 'none';
        warnT = setTimeout(() => { el('idle-w').style.display = 'block' }, IDLE_WARN);
        idleT = setTimeout(() => { notif('warning', 'Auto Logout', 'Sesi berakhir.'); doLogout(); }, IDLE_OUT);
      };
      ['mousemove', 'keydown', 'touchstart', 'click'].forEach(e => document.addEventListener(e, reset, { passive: true }));
      reset();
    }

    // ═══════════════════════ APP INIT ═══════════════════════
    function initApp() {
      el('page-login').style.display = 'none'; el('page-register').style.display = 'none';
      el('app-shell').classList.add('active'); el('app-shell').style.display = 'flex';
      if (CU.role === 'admin') {
        el('sidebar-admin').style.display = 'flex'; el('sidebar-user').style.display = 'none';
        el('adm-name').textContent = CU.name; el('adm-av').textContent = CU.name[0];
        initAdminDash(); switchPage('admin-dashboard', null);
      } else {
        el('sidebar-user').style.display = 'flex'; el('sidebar-admin').style.display = 'none';
        el('usr-name').textContent = CU.name; el('usr-av').textContent = CU.name[0];
        initUserDash(); switchPage('user-dashboard', null);
      }
      startClock();
    }

    // ═══════════════════════ NAVIGATION ═══════════════════════
    const titles = { 'admin-dashboard': 'Dashboard Admin', 'admin-qr': 'Generate QR Code', 'admin-attendance': 'Data Absensi', 'admin-users': 'Kelola Pengguna', 'admin-report': 'Laporan & Analitik', 'admin-settings': 'Pengaturan', 'user-dashboard': 'Beranda', 'user-scan': 'Scan QR Code', 'user-history': 'Riwayat Absensi', 'user-profile': 'Profil Saya' };

    function switchPage(id, nav) {
      document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
      const pg = el('page-' + id); if (pg) pg.classList.add('active');
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      if (nav) nav.classList.add('active');
      el('topbar-title').textContent = titles[id] || id;
      closeSidebar();
      if (id === 'admin-attendance') renderAttTable();
      if (id === 'admin-users') renderUsrTable();
      if (id === 'admin-qr') renderQRHist();
      if (id === 'admin-report') initReport();
      if (id === 'user-history') renderUserHistory();
      if (id === 'user-profile') loadProfile();
      if (id === 'user-scan') initGPS();
    }

    function showAuthPage(id) {
      ['page-login', 'page-register'].forEach(p => { el(p).style.display = 'none' });
      el(id).style.display = 'grid';
    }

    function toggleSidebar() {
      const sb = CU?.role === 'admin' ? el('sidebar-admin') : el('sidebar-user');
      const bd = el('sidebar-backdrop');
      sb.classList.toggle('open'); bd.classList.toggle('active');
    }
    function closeSidebar() {
      document.querySelectorAll('.sidebar').forEach(s => s.classList.remove('open'));
      el('sidebar-backdrop').classList.remove('active');
    }

    // ═══════════════════════ CLOCK ═══════════════════════
    function startClock() {
      const tick = () => { el('topbar-clock').textContent = new Date().toLocaleTimeString('id-ID'); };
      tick(); setInterval(tick, 1000);
    }

    // ═══════════════════════ ADMIN DASHBOARD ═══════════════════════
    let cW, cD, cM;
    function initAdminDash() {
      const today = new Date().toISOString().split('T')[0];
      el('today-label').textContent = 'Tanggal: ' + fmtDate(today);
      const tr = DB.attendance.filter(a => a.date === today);
      const h = tr.filter(a => a.status === 'hadir').length, t = tr.filter(a => a.status === 'telat').length;
      const tot = DB.users.filter(u => u.role === 'user' && u.active).length;
      const al = Math.max(0, tot - h - t);
      el('s-total').textContent = tot; el('s-hadir').textContent = h; el('s-telat').textContent = t; el('s-alfa').textContent = al;
      el('absent-badge').textContent = al;
      renderRecent(tr.slice(0, 8));
      setTimeout(initCharts, 80);
    }

    function renderRecent(recs) {
      const tb = el('recent-tbody');
      if (!recs.length) { tb.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">📭</div><div class="empty-title">Belum ada data hari ini</div></div></td></tr>`; return; }
      tb.innerHTML = recs.map((r, i) => `<tr><td>${i + 1}</td><td><strong>${r.userName}</strong></td><td><code>${r.userNip}</code></td><td>${r.checkin || '-'}</td><td>${r.checkout || '<span class="badge badge-yellow">Belum</span>'}</td><td>${sBadge(r.status)}</td></tr>`).join('');
    }

    function initCharts() {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      Chart.defaults.color = isDark ? '#a09890' : '#6b6560';
      const days = [], hd = [], td = [], ad = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        if (d.getDay() === 0 || d.getDay() === 6) continue;
        const ds = d.toISOString().split('T')[0];
        const recs = DB.attendance.filter(a => a.date === ds);
        const tot = DB.users.filter(u => u.role === 'user' && u.active).length;
        days.push(d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }));
        hd.push(recs.filter(r => r.status === 'hadir').length);
        td.push(recs.filter(r => r.status === 'telat').length);
        ad.push(Math.max(0, tot - recs.length));
      }
      if (cW) cW.destroy();
      cW = new Chart(el('chart-weekly').getContext('2d'), { type: 'bar', data: { labels: days, datasets: [{ label: 'Hadir', data: hd, backgroundColor: '#16a34a99', borderColor: '#16a34a', borderWidth: 2, borderRadius: 5 }, { label: 'Telat', data: td, backgroundColor: '#d9770699', borderColor: '#d97706', borderWidth: 2, borderRadius: 5 }, { label: 'Alfa', data: ad, backgroundColor: '#dc262655', borderColor: '#dc2626', borderWidth: 2, borderRadius: 5 }] }, options: { responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } } });
      const today = new Date().toISOString().split('T')[0];
      const tr = DB.attendance.filter(a => a.date === today);
      const h = tr.filter(r => r.status === 'hadir').length, t = tr.filter(r => r.status === 'telat').length;
      const tot = DB.users.filter(u => u.role === 'user' && u.active).length;
      if (cD) cD.destroy();
      cD = new Chart(el('chart-donut').getContext('2d'), { type: 'doughnut', data: { labels: ['Hadir', 'Terlambat', 'Alfa'], datasets: [{ data: [h, t, Math.max(0, tot - h - t)], backgroundColor: ['#16a34a', '#d97706', '#dc2626'], borderWidth: 2 }] }, options: { responsive: true, plugins: { legend: { position: 'bottom' } }, cutout: '62%' } });
    }

    // ═══════════════════════ QR GENERATE ═══════════════════════
    let activeQR = null, qrTimer = null;

    function generateQR() {
      if (qrTimer) clearInterval(qrTimer);
      const type = el('qr-type').value, dur = parseInt(el('qr-dur').value);
      const loc = el('qr-loc').value || 'Ruang Utama';
      const token = 'QR-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
      const now = new Date(), exp = new Date(now.getTime() + dur * 60 * 1000);
      activeQR = { token, type, location: loc, createdAt: now, expiredAt: exp, scannedBy: [], durationMs: dur * 60 * 1000 };
      DB.qrCodes.unshift({ ...activeQR, scanCount: 0 });
      const disp = el('qr-display');
      disp.innerHTML = ''; disp.style.cssText = 'width:200px;height:200px';
      new QRCode(disp, { text: JSON.stringify({ token, type, loc, exp: exp.getTime() }), width: 200, height: 200, colorDark: '#1a1814', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.H });
      el('qr-exp-overlay').style.display = 'none';
      el('btn-dl').style.display = 'inline-flex'; el('btn-fs').style.display = 'inline-flex';
      el('qr-info-box').style.display = 'block';
      el('qi-t').textContent = type === 'checkin' ? 'Check-in' : 'Check-out';
      el('qi-l').textContent = loc; el('qi-e').textContent = exp.toLocaleTimeString('id-ID');
      el('qr-badge').textContent = '● Aktif'; el('qr-badge').className = 'badge badge-green';
      el('cr-ring').style.display = 'block';
      const circ = 2 * Math.PI * 44;
      const tick = () => {
        const rem = Math.max(0, exp - new Date()), sec = Math.floor(rem / 1000);
        const pct = rem / (dur * 60 * 1000);
        el('cr-n').textContent = sec > 60 ? Math.floor(sec / 60) + 'm' : sec;
        el('qr-tleft').textContent = `Expired dalam ${sec} detik`;
        el('ring-c').style.strokeDashoffset = circ * (1 - pct);
        el('ring-c').style.stroke = pct > .5 ? 'var(--accent)' : pct > .25 ? 'var(--warning)' : 'var(--danger)';
        el('qr-prog').style.width = (pct * 100) + '%';
        el('qr-prog').style.background = pct > .5 ? 'var(--accent)' : pct > .25 ? 'var(--warning)' : 'var(--danger)';
        if (rem <= 0) {
          clearInterval(qrTimer);
          el('qr-exp-overlay').style.display = 'flex';
          el('qr-badge').textContent = '● Expired'; el('qr-badge').className = 'badge badge-red';
          el('cr-n').textContent = '0';
          notif('warning', 'QR Expired', 'QR Code telah kedaluwarsa. Generate ulang jika perlu.');
        }
      };
      tick(); qrTimer = setInterval(tick, 1000);
      notif('success', 'QR Code Dibuat', `Token: ${token.slice(0, 20)}... | Valid ${dur} menit`);
      renderQRHist();
    }

    function downloadQR() {
      const c = document.querySelector('#qr-display canvas'); if (!c) return;
      const a = document.createElement('a'); a.download = 'QR-Absensi-' + new Date().toISOString().split('T')[0] + '.png';
      a.href = c.toDataURL(); a.click();
      notif('success', 'Downloaded', 'QR Code berhasil diunduh!');
    }

    function showQRFullscreen() {
      const m = el('qr-fs-modal'), disp = el('qr-fs-display');
      disp.innerHTML = '';
      if (activeQR) new QRCode(disp, { text: JSON.stringify({ token: activeQR.token, type: activeQR.type }), width: 280, height: 280, colorDark: '#1a1814', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.H });
      m.classList.add('active');
    }
    function closeFS() { el('qr-fs-modal').classList.remove('active'); }

    function renderQRHist() {
      const tb = el('qr-hist');
      if (!DB.qrCodes.length) { tb.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">📱</div><div class="empty-title">Belum ada QR Code</div></div></td></tr>`; return; }
      tb.innerHTML = DB.qrCodes.slice(0, 10).map(q => {
        const exp = new Date(q.expiredAt), expired = exp < new Date();
        return `<tr><td><code>${q.token.slice(0, 22)}...</code></td><td>${q.type === 'checkin' ? '<span class="badge badge-green">Check-in</span>' : '<span class="badge badge-blue">Check-out</span>'}</td><td>${new Date(q.createdAt).toLocaleString('id-ID')}</td><td>${exp.toLocaleString('id-ID')}</td><td>${q.scannedBy?.length || 0}</td><td>${expired ? '<span class="badge badge-red">Expired</span>' : '<span class="badge badge-green">Aktif</span>'}</td></tr>`;
      }).join('');
    }

    // ═══════════════════════ ATTENDANCE TABLE ═══════════════════════
    function renderAttTable(data) {
      const recs = (data || DB.attendance).slice().reverse();
      const tb = el('att-tbody');
      if (!recs.length) { tb.innerHTML = `<tr><td colspan="10"><div class="empty-state"><div class="empty-icon">📭</div><div class="empty-title">Tidak ada data</div></div></td></tr>`; return; }
      tb.innerHTML = recs.map((r, i) => `<tr><td>${i + 1}</td><td><strong>${r.userName}</strong></td><td><code>${r.userNip}</code></td><td>${r.userDept}</td><td>${fmtDate(r.date)}</td><td>${r.checkin}</td><td>${r.checkout || '<span class="badge badge-yellow">Belum</span>'}</td><td>${calcDur(r.checkin, r.checkout)}</td><td>${sBadge(r.status)}</td><td><button class="btn btn-ghost btn-sm" onclick="editAtt(${r.id})">✏️</button> <button class="btn btn-danger btn-sm" onclick="delAtt(${r.id})">🗑️</button></td></tr>`).join('');
    }

    function filterTable() {
      const d = el('f-date').value, s = el('f-search').value.toLowerCase(), st = el('f-status').value;
      renderAttTable(DB.attendance.filter(r => {
        if (d && r.date !== d) return false;
        if (s && !r.userName.toLowerCase().includes(s) && !r.userNip.toLowerCase().includes(s)) return false;
        if (st && r.status !== st) return false;
        return true;
      }));
    }
    function clearFilters() { el('f-date').value = ''; el('f-search').value = ''; el('f-status').value = ''; renderAttTable(); }

    function editAtt(id) {
      const r = DB.attendance.find(a => a.id === id); if (!r) return;
      el('m-title').textContent = '✏️ Edit Absensi'; el('m-sub').textContent = `${r.userName} — ${fmtDate(r.date)}`;
      el('m-body').innerHTML = `<div class="form-group"><label class="form-label">Check-in</label><input type="time" class="form-control" id="e-ci" value="${r.checkin || ''}"></div><div class="form-group"><label class="form-label">Check-out</label><input type="time" class="form-control" id="e-co" value="${r.checkout || ''}"></div><div class="form-group"><label class="form-label">Status</label><select class="form-control" id="e-st"><option value="hadir" ${r.status === 'hadir' ? 'selected' : ''}>Hadir</option><option value="telat" ${r.status === 'telat' ? 'selected' : ''}>Terlambat</option><option value="alfa" ${r.status === 'alfa' ? 'selected' : ''}>Alfa</option></select></div>`;
      el('m-ok').onclick = () => { r.checkin = el('e-ci').value; r.checkout = el('e-co').value; r.status = el('e-st').value; closeModal(); renderAttTable(); notif('success', 'Berhasil', 'Data absensi diperbarui!'); };
      el('modal-ol').classList.add('active');
    }

    function delAtt(id) {
      el('m-title').textContent = '🗑️ Hapus Data'; el('m-sub').textContent = 'Tindakan tidak bisa dibatalkan.';
      el('m-body').innerHTML = ''; el('m-ok').className = 'btn btn-danger btn-sm'; el('m-ok').textContent = 'Ya, Hapus';
      el('m-ok').onclick = () => { DB.attendance = DB.attendance.filter(r => r.id !== id); closeModal(); renderAttTable(); notif('success', 'Dihapus', 'Data berhasil dihapus.'); };
      el('modal-ol').classList.add('active');
    }

    // ═══════════════════════ USERS TABLE ═══════════════════════
    function renderUsrTable() {
      el('usr-tbody').innerHTML = DB.users.map((u, i) => `<tr><td>${i + 1}</td><td><strong>${u.name}</strong></td><td><code>${u.nip}</code></td><td>${u.email}</td><td>${u.dept}</td><td><span class="badge ${u.role === 'admin' ? 'badge-blue' : 'badge-gray'}">${u.role}</span></td><td>${u.active ? '<span class="badge badge-green">Aktif</span>' : '<span class="badge badge-red">Nonaktif</span>'}</td><td><button class="btn btn-ghost btn-sm" onclick="toggleUser(${u.id})">${u.active ? '🔒' : '✅'}</button> <button class="btn btn-danger btn-sm" onclick="delUser(${u.id})">🗑️</button></td></tr>`).join('');
    }
    function openAddUser() { el('add-usr-modal').classList.add('active'); }
    function closeAddUser() { el('add-usr-modal').classList.remove('active'); }
    function addUser() {
      const n = el('nu-name').value.trim(), em = el('nu-email').value.trim();
      const nip = el('nu-nip').value.trim(), dept = el('nu-dept').value.trim();
      const pass = el('nu-pass').value, role = el('nu-role').value;
      if (!n || !em || !nip || !pass) { notif('error', 'Error', 'Semua field wajib!'); return; }
      DB.users.push({ id: ++DB.nextId, name: n, email: em, nip, dept, role, password: 'demo', active: true });
      closeAddUser(); renderUsrTable();
      notif('success', 'Berhasil', `${n} berhasil ditambahkan!`);
    }
    function toggleUser(id) { const u = DB.users.find(u => u.id === id); if (u) { u.active = !u.active; renderUsrTable(); notif('success', 'Berhasil', `Status ${u.name} diperbarui.`); } }
    function delUser(id) { if (id === CU.id) { notif('error', 'Error', 'Tidak bisa hapus akun sendiri!'); return; } DB.users = DB.users.filter(u => u.id !== id); renderUsrTable(); notif('success', 'Dihapus', 'Pengguna dihapus.'); }

    // ═══════════════════════ REPORT ═══════════════════════
    function initReport() {
      const ms = new Date().toISOString().slice(0, 7);
      const mr = DB.attendance.filter(a => a.date.startsWith(ms));
      const td = 22, uc = DB.users.filter(u => u.role === 'user' && u.active).length;
      const avg = uc ? Math.round((mr.length / (uc * td)) * 100) : 0;
      const late = mr.filter(r => r.status === 'telat').length;
      const perf = DB.users.filter(u => u.role === 'user' && u.active).filter(u => { const rr = mr.filter(r => r.userId === u.id); return rr.length >= td && rr.every(r => r.status === 'hadir'); }).length;
      el('r-avg').textContent = avg + '%'; el('r-late').textContent = late; el('r-perf').textContent = perf;
      const wks = ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'];
      const wd = wks.map((_, i) => mr.filter((_, j) => Math.floor(j / 5) === i).length);
      if (cM) cM.destroy();
      cM = new Chart(el('chart-monthly').getContext('2d'), { type: 'line', data: { labels: wks, datasets: [{ label: 'Kehadiran', data: wd, fill: true, tension: .4, backgroundColor: 'rgba(45,91,227,.1)', borderColor: 'var(--accent)', borderWidth: 2, pointRadius: 5 }] }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } } });
      const us = DB.users.filter(u => u.role === 'user' && u.active).map(u => ({ name: u.name, dept: u.dept, cnt: mr.filter(r => r.userId === u.id).length, pct: Math.round((mr.filter(r => r.userId === u.id).length / td) * 100) })).sort((a, b) => b.cnt - a.cnt).slice(0, 5);
      el('top-list').innerHTML = us.map((u, i) => `<div class="flex ai-c g3 mb1"><div style="width:28px;height:28px;border-radius:50%;background:var(--accent-light);color:var(--accent);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex-shrink:0">${i + 1}</div><div style="flex:1"><div class="fw7 ts">${u.name}</div><div class="txs tc">${u.dept}</div><div class="progress-bar"><div class="progress-fill" style="width:${u.pct}%"></div></div></div><div class="fw7" style="color:var(--accent)">${u.pct}%</div></div>`).join('');
    }

    // ═══════════════════════ EXPORT ═══════════════════════
    function exportPDF() {
      const { jsPDF } = window.jspdf; const doc = new jsPDF();
      doc.setFontSize(16); doc.setFont('helvetica', 'bold');
      doc.text('Laporan Absensi — AbsensiQR', 20, 18);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.text('Dicetak: ' + new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), 20, 27);
      let y = 42;
      doc.setFont('helvetica', 'bold');
      ['No', 'Nama', 'NIP', 'Tanggal', 'Check-in', 'Check-out', 'Status'].forEach((h, i) => doc.text(h, [14, 25, 55, 80, 110, 135, 162][i], y));
      doc.line(14, y + 2, 196, y + 2); y += 8; doc.setFont('helvetica', 'normal');
      DB.attendance.slice(0, 35).forEach((r, i) => {
        if (y > 270) { doc.addPage(); y = 20; }
        [String(i + 1), r.userName.substring(0, 18), r.userNip, r.date, r.checkin, r.checkout || '-', r.status].forEach((v, j) => doc.text(v, [14, 25, 55, 80, 110, 135, 162][j], y));
        y += 7;
      });
      doc.save('Absensi-' + new Date().toISOString().split('T')[0] + '.pdf');
      notif('success', 'Export PDF', 'File PDF berhasil diunduh!');
    }

    function exportExcel() {
      const rows = [['No', 'Nama', 'NIP', 'Departemen', 'Tanggal', 'Check-in', 'Check-out', 'Status']];
      DB.attendance.forEach((r, i) => rows.push([i + 1, r.userName, r.userNip, r.userDept, r.date, r.checkin, r.checkout || '', r.status]));
      const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = 'Absensi-' + new Date().toISOString().split('T')[0] + '.csv'; a.click();
      notif('success', 'Export CSV', 'File CSV berhasil diunduh!');
    }

    // ═══════════════════════ SETTINGS ═══════════════════════
    function saveSettings() {
      DB.settings.checkin = el('set-ci').value; DB.settings.checkout = el('set-co').value;
      DB.settings.tolerance = parseInt(el('set-tol').value); DB.settings.gps = el('set-gps').value;
      DB.settings.radius = parseInt(el('set-rad').value);
      notif('success', 'Disimpan', 'Pengaturan berhasil diperbarui!');
    }

    // ═══════════════════════ USER DASHBOARD ═══════════════════════
    function initUserDash() {
      const today = new Date().toISOString().split('T')[0];
      const ur = DB.attendance.filter(r => r.userId === CU.id);
      const tr = ur.find(r => r.date === today);
      const h = ur.filter(r => r.status === 'hadir').length, t = ur.filter(r => r.status === 'telat').length;
      const pct = ur.length ? Math.round(((h + t) / Math.max(ur.length, 1)) * 100) : 0;
      el('u-pname').textContent = CU.name; el('u-pdept').textContent = CU.dept;
      el('u-big-av').textContent = CU.name[0];
      el('u-s-h').textContent = h; el('u-s-t').textContent = t; el('u-s-p').textContent = pct + '%';
      el('u-ci').textContent = tr?.checkin || '--:--'; el('u-co').textContent = tr?.checkout || 'Belum';
      if (tr) {
        el('u-st-icon').textContent = tr.status === 'hadir' ? '✅' : '⏰';
        el('u-st-text').textContent = tr.status === 'hadir' ? 'Hadir Tepat Waktu' : 'Terlambat';
        el('u-st-sub').textContent = `Check-in: ${tr.checkin} | Status: ${tr.status.toUpperCase()}`;
        el('u-status-card').style.borderColor = tr.status === 'hadir' ? 'var(--success)' : 'var(--warning)';
      }
      const tb = el('u-recent'), rec = ur.slice(-5).reverse();
      if (!rec.length) { tb.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">📭</div><div class="empty-title">Belum ada data</div></div></td></tr>`; return; }
      tb.innerHTML = rec.map(r => `<tr><td>${fmtDate(r.date)}</td><td>${r.checkin}</td><td>${r.checkout || '<span class="badge badge-yellow">Belum</span>'}</td><td>${calcDur(r.checkin, r.checkout)}</td><td>${sBadge(r.status)}</td></tr>`).join('');
    }

    function renderUserHistory() {
      const fm = el('u-f-month').value;
      const recs = DB.attendance.filter(r => r.userId === CU.id && (!fm || r.date.startsWith(fm))).sort((a, b) => b.date.localeCompare(a.date));
      const tb = el('u-hist-tbody');
      if (!recs.length) { tb.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">📭</div><div class="empty-title">Tidak ada data</div></div></td></tr>`; return; }
      tb.innerHTML = recs.map((r, i) => `<tr><td>${i + 1}</td><td>${fmtDate(r.date)}</td><td>${getDayName(r.date)}</td><td>${r.checkin}</td><td>${r.checkout || '<span class="badge badge-yellow">Belum</span>'}</td><td>${calcDur(r.checkin, r.checkout)}</td><td>${sBadge(r.status)}</td></tr>`).join('');
    }

    // ═══════════════════════ CAMERA SCAN ═══════════════════════
    let camStream = null, scanLoop = null;

    function startCamera() {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } })
        .then(stream => {
          camStream = stream;
          const v = el('scan-video'); v.srcObject = stream;
          el('scan-video-wrap').style.display = 'block'; el('scan-ph').style.display = 'none';
          el('btn-stop').style.display = 'block';
          startScanLoop(); notif('info', 'Kamera Aktif', 'Arahkan ke QR Code');
        }).catch(err => notif('error', 'Kamera Error', err.message));
    }

    function stopCamera() {
      if (camStream) { camStream.getTracks().forEach(t => t.stop()); camStream = null; }
      clearInterval(scanLoop);
      const vw = el('scan-video-wrap'); if (vw) vw.style.display = 'none';
      const ph = el('scan-ph'); if (ph) ph.style.display = 'block';
      const bs = el('btn-stop'); if (bs) bs.style.display = 'none';
    }

    function startScanLoop() {
      const v = el('scan-video'), c = el('scan-canvas'), ctx = c.getContext('2d');
      scanLoop = setInterval(() => {
        if (v.readyState !== v.HAVE_ENOUGH_DATA) return;
        c.width = v.videoWidth; c.height = v.videoHeight;
        ctx.drawImage(v, 0, 0, c.width, c.height);
        const img = ctx.getImageData(0, 0, c.width, c.height);
        const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
        if (code) processQR(code.data);
      }, 200);
    }

    function processQR(raw) {
      clearInterval(scanLoop); stopCamera();
      let d; try { d = JSON.parse(raw); } catch { showScanRes('error', '❌', 'QR Tidak Valid', 'Format QR tidak dikenali.'); return; }
      const now = new Date(), today = now.toISOString().split('T')[0];
      const qr = DB.qrCodes.find(q => q.token === d.token);
      if (!qr) { showScanRes('error', '❌', 'QR Tidak Ditemukan', 'Token tidak terdaftar di sistem.'); return; }
      if (now > new Date(qr.expiredAt)) { showScanRes('error', '⏰', 'QR Expired', `Expired: ${new Date(qr.expiredAt).toLocaleTimeString('id-ID')}`); return; }
      if (qr.scannedBy?.includes(CU.id)) { showScanRes('error', '🚫', 'Sudah Scan', 'Anda sudah menggunakan QR Code ini.'); return; }
      const tr = DB.attendance.find(r => r.userId === CU.id && r.date === today);
      if (qr.type === 'checkin' && tr?.checkin) { showScanRes('error', '🚫', 'Sudah Check-in', `Check-in pukul ${tr.checkin}`); return; }
      if (qr.type === 'checkout' && !tr?.checkin) { showScanRes('error', '⚠️', 'Belum Check-in', 'Lakukan check-in terlebih dahulu!'); return; }
      if (qr.type === 'checkout' && tr?.checkout) { showScanRes('error', '🚫', 'Sudah Check-out', `Check-out pukul ${tr.checkout}`); return; }
      const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const [sh, sm] = DB.settings.checkin.split(':').map(Number);
      const [nh, nm] = timeStr.split(':').map(Number);
      const lm = (nh * 60 + nm) - (sh * 60 + sm), status = lm > DB.settings.tolerance ? 'telat' : 'hadir';
      if (qr.type === 'checkin') {
        if (tr) { tr.checkin = timeStr; tr.status = status; }
        else DB.attendance.push({ id: ++DB.nextId, userId: CU.id, userName: CU.name, userNip: CU.nip, userDept: CU.dept, date: today, checkin: timeStr, checkout: null, status, qrToken: qr.token, late: lm > 0 ? lm : 0 });
        showScanRes(status === 'hadir' ? 'success' : 'warning', status === 'hadir' ? '✅' : '⏰', status === 'hadir' ? 'Check-in Berhasil!' : 'Terlambat!', status === 'hadir' ? `Hadir tepat waktu pukul ${timeStr}` : `Terlambat ${lm} menit`);
      } else {
        if (tr) { tr.checkout = timeStr; showScanRes('success', '🏁', 'Check-out Berhasil!', `Sampai jumpa! Tercatat pukul ${timeStr}`); }
      }
      if (!qr.scannedBy) qr.scannedBy = [];
      qr.scannedBy.push(CU.id);
      initUserDash(); initAdminDash();
    }

    function showScanRes(type, icon, title, msg) {
      const res = el('scan-res'), card = el('scan-res-card');
      const cols = { success: 'var(--success)', error: 'var(--danger)', warning: 'var(--warning)' };
      el('sr-icon').textContent = icon; el('sr-title').textContent = title;
      el('sr-msg').textContent = msg; el('sr-time').textContent = new Date().toLocaleTimeString('id-ID');
      card.style.borderColor = cols[type]; res.style.display = 'block';
      notif(type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'error', title, msg);
      setTimeout(() => { res.style.display = 'none' }, 8000);
    }

    // ═══════════════════════ GPS ═══════════════════════
    function initGPS() {
      if (!navigator.geolocation) { updGPS('fail', 'GPS tidak tersedia'); return; }
      updGPS('checking', 'Memeriksa lokasi GPS...');
      navigator.geolocation.getCurrentPosition(
        pos => {
          const d = calcDist(pos.coords.latitude, pos.coords.longitude, DB.settings.lat, DB.settings.lng);
          if (DB.settings.gps === 'off') updGPS('ok', 'Validasi GPS dinonaktifkan (Mode Demo)');
          else if (d <= DB.settings.radius) updGPS('ok', `Lokasi valid — ${Math.round(d)}m dari titik absensi`);
          else updGPS('fail', `Di luar radius! ${Math.round(d)}m (maks ${DB.settings.radius}m)`);
        },
        () => updGPS('fail', 'Tidak dapat mengambil lokasi'),
        { timeout: 8000 }
      );
    }

    function updGPS(state, msg) {
      const b = el('gps-st'), t = el('gps-txt');
      b.className = `gps-status gps-${state}`;
      t.textContent = msg;
      b.style.background = state === 'ok' ? 'var(--success-light)' : state === 'fail' ? 'var(--danger-light)' : 'var(--surface2)';
      b.style.borderColor = state === 'ok' ? 'var(--success)' : state === 'fail' ? 'var(--danger)' : 'var(--border)';
    }

    function calcDist(la1, lo1, la2, lo2) {
      const R = 6371e3, p1 = la1 * Math.PI / 180, p2 = la2 * Math.PI / 180;
      const dp = (la2 - la1) * Math.PI / 180, dl = (lo2 - lo1) * Math.PI / 180;
      const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    // ═══════════════════════ PROFILE ═══════════════════════
    function loadProfile() { el('pf-name').value = CU.name; el('pf-email').value = CU.email; el('pf-nip').value = CU.nip; el('pf-dept').value = CU.dept; }
    function saveProfile() {
      const n = el('pf-name').value.trim(), em = el('pf-email').value.trim(), dept = el('pf-dept').value.trim();
      if (!n || !em) { notif('error', 'Error', 'Nama dan email wajib!'); return; }
      const u = DB.users.find(u => u.id === CU.id);
      if (u) { u.name = n; u.email = em; u.dept = dept; CU.name = n; CU.email = em; CU.dept = dept; el('usr-name').textContent = n; notif('success', 'Berhasil', 'Profil diperbarui!'); }
    }
    function changePass() {
      const op = el('pf-op').value, np = el('pf-np').value;
      if (!op || !np) { notif('error', 'Error', 'Semua field wajib!'); return; }
      if (np.length < 8) { notif('error', 'Error', 'Min. 8 karakter!'); return; }
      notif('success', 'Berhasil', 'Password berhasil diubah! (Demo)');
      el('pf-op').value = ''; el('pf-np').value = '';
    }

    // ═══════════════════════ THEME ═══════════════════════
    function toggleTheme() {
      const html = document.documentElement, isDark = html.getAttribute('data-theme') === 'dark';
      html.setAttribute('data-theme', isDark ? 'light' : 'dark');
      el('topbar-clock').parentElement.querySelector('.theme-toggle').textContent = isDark ? '🌙' : '☀️';
      setTimeout(initCharts, 80);
      notif('info', isDark ? 'Light Mode' : 'Dark Mode', 'Tema berhasil diganti!');
    }

    // ═══════════════════════ NOTIFICATIONS ═══════════════════════
    function notif(type, title, msg) {
      const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
      const c = el('notif-c'), n = document.createElement('div');
      n.className = `notif ${type}`;
      n.innerHTML = `<div class="notif-icon">${icons[type] || 'ℹ️'}</div><div><div class="notif-title">${title}</div><div class="notif-msg">${msg}</div></div>`;
      c.appendChild(n);
      setTimeout(() => { n.style.animation = 'slideOut .3s ease forwards'; setTimeout(() => n.remove(), 300); }, 4000);
    }

    // ═══════════════════════ MODAL ═══════════════════════
    function closeModalOL(e) { if (e.target === el('modal-ol')) closeModal(); }
    function closeModal() {
      el('modal-ol').classList.remove('active');
      el('m-ok').className = 'btn btn-primary btn-sm';
      el('m-ok').textContent = 'Konfirmasi';
    }

    // ═══════════════════════ UTILITIES ═══════════════════════
    const el = id => document.getElementById(id);
    function fmtDate(s) { return new Date(s).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); }
    function getDayName(s) { return new Date(s).toLocaleDateString('id-ID', { weekday: 'long' }); }
    function calcDur(ci, co) {
      if (!ci || !co) return '-';
      const [h1, m1] = ci.split(':').map(Number), [h2, m2] = co.split(':').map(Number);
      const d = (h2 * 60 + m2) - (h1 * 60 + m1); if (d <= 0) return '-';
      return Math.floor(d / 60) > 0 ? `${Math.floor(d / 60)}j ${d % 60}m` : `${d % 60}m`;
    }
    function sBadge(s) { return { hadir: '<span class="badge badge-green">✅ Hadir</span>', telat: '<span class="badge badge-yellow">⏰ Terlambat</span>', alfa: '<span class="badge badge-red">❌ Alfa</span>' }[s] || `<span class="badge badge-gray">${s}</span>`; }

    // ═══════════════════════ DEMO QR FOR TESTING ═══════════════════════
    (function () {
      const now = new Date(), exp = new Date(now.getTime() + 3600 * 1000);
      DB.qrCodes.push({ token: 'QR-DEMO2024-TESTXYZ', type: 'checkin', location: 'Demo Room', createdAt: now, expiredAt: exp, scannedBy: [], durationMs: 3600000 });
    })();

    // ═══════════════════════ INIT ═══════════════════════
    document.addEventListener('DOMContentLoaded', () => {
      const s = sessionStorage.getItem('qr_session');
      if (s) { const { uid } = JSON.parse(s); const u = DB.users.find(u => u.id === uid); if (u) { CU = { ...u }; startIdle(); initApp(); return; } }
      showAuthPage('page-login');
    });
