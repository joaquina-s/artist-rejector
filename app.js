/* =========================================================
   ARTIST REJECTOR — lógica del simulador de bandeja.
   Los rechazos se generan proceduralmente y nunca paran.
   ========================================================= */

(function () {
    'use strict';

    // ---------- config ----------
    const APPLICANT = 'Joaquina';            // a quién rechazan
    const APPLICANT_EMAIL = 'joaquina@studio.art';
    const BASE_REJECTIONS = 247;             // rechazos previos de "tu carrera"
    const ARRIVAL_MIN = 6000;                // ms entre rechazos (mín)
    const ARRIVAL_MAX = 13000;               // ms entre rechazos (máx)

    // ---------- data pools ----------
    const ORGS = [
        'Liminal Arts Foundation', 'Casa Vacía Residency', 'The Hessdalen Institute',
        'Fondazione Margine', 'NowHere Media Lab', 'Künstlerverein Grauzone',
        'Centro de Arte La Brecha', 'Transversal Practices Fund', 'The Atlas Programme',
        'Stiftung für Neue Bilder', 'Delta Sound & Image Residency', 'The Penumbra Fellowship',
        'Fundación Tierra Firme', 'New Babylon Arts Council', 'Maison des Écarts',
        'The Quiet Room Residency', 'Hypogeum Contemporary', 'Fonds Horizon',
        'The Driftwood Biennial', 'Instituto de Prácticas Expandidas', 'Echo Chamber Collective',
        'The Membrane Foundation', 'Nordlys Air Programme', 'Galería Punto Ciego',
        'The Threshold Trust', 'Hollow Tide Arts', 'Studio Ortega', 'Periphery Lab'
    ];

    const PROGRAMS_EN = [
        'Residency Programme 2026', 'Production Grant', 'International Open Call',
        'Fellowship in New Media', 'Annual Bursary', 'Commission Award',
        'Emerging Artist Prize', 'Summer Residency', 'Research Grant',
        'Project Development Fund', 'Digital Cultures Residency', 'Winter Open Call'
    ];
    const PROGRAMS_ES = [
        'Convocatoria 2026', 'Beca de Producción', 'Residencia Internacional',
        'Programa de Apoyo a la Creación', 'Premio Arte Emergente', 'Beca de Investigación',
        'Residencia de Verano', 'Fondo de Movilidad', 'Convocatoria de Nuevos Medios'
    ];

    const MAIL_PREFIX = ['noreply', 'applications', 'opencall', 'submissions', 'info', 'grants', 'jury'];

    const NAMES = [
        'Dr. M. Albrecht', 'Sofía Reyes', 'J. Mortensen', 'Camille Dubois', 'A. Novak',
        'Lukas Brenner', 'Elena Marchetti', 'Yara Haddad', 'T. Okonkwo', 'Ingrid Vos',
        'P. Lindqvist', 'Renata Gallo', 'H. Nakamura', 'Mateo Duarte'
    ];

    // avatares del sender (imágenes cuadradas en /Image)
    const AVATARS = [
        'colorB1.png', 'colorB2.png', 'colorB3.png', 'colorB4.png',
        'colorB5.png', 'colorB6.png', 'colorB7.png', 'colorB8.png',
        'colorBH1.png', 'colorBH2.png', 'colorBH3.png', 'colorBH4.png',
        'colorBH5.png', 'colorBH6.png', 'colorBH7.png', 'colorBH8.png'
    ];

    // ---- English building blocks ----
    const EN = {
        greet: [`Dear ${APPLICANT},`, 'Dear Applicant,', `Dear ${APPLICANT},`, 'Dear Artist,'],
        open: [
            'Thank you for your application to the {program} at {org}.',
            'Thank you for taking the time to submit your proposal to {org}.',
            'We are writing regarding your recent application to the {program}.',
            'On behalf of {org}, thank you for your interest in the {program}.'
        ],
        volume: [
            'This year we received {N} applications for only {M} available places.',
            'We were overwhelmed by the response — {N} artists applied in this cycle.',
            'The committee reviewed a record {N} submissions of exceptional quality.',
            'With {N} proposals for {M} spots, the selection was extraordinarily competitive.'
        ],
        reject: [
            'After careful and lengthy deliberation, we regret to inform you that your application was not successful on this occasion.',
            'It is with regret that we must tell you we are unable to offer you a place this time.',
            'Unfortunately, your proposal was not selected to move forward in the process.',
            'We are sorry to say that, after much consideration, your application has not been shortlisted.'
        ],
        soften: [
            'Please know that this decision is in no way a reflection of the quality or value of your work.',
            'The panel was genuinely impressed by your practice, and the choice was extremely difficult.',
            'Many strong proposals, including yours, simply could not be accommodated within our capacity.',
            'This outcome reflects the constraints of our programme far more than the merit of your project.',
            'This year the selection followed specific curatorial priorities that, on this occasion, did not align with your proposal.'
        ],
        encourage: [
            'We would sincerely encourage you to apply again in a future round.',
            'We hope you will consider submitting to our next open call.',
            'We wish you every success with your work and future endeavours.',
            'We have no doubt you will find the right opportunity elsewhere.'
        ],
        close: ['Warm regards,', 'Kind regards,', 'With our best wishes,', 'Sincerely,', 'Yours faithfully,'],
        roles: ['Selection Committee', 'Programme Director', 'Curatorial Team', 'Grants Office', 'Jury Coordinator', 'Artistic Direction', 'Open Call Team'],
        subject: [
            'Outcome of your application — {program}',
            '{program}: selection results',
            'Regarding your application to {org}',
            'Your {program} application',
            'Application update — {program}',
            'A decision regarding your submission'
        ]
    };

    // ---- Spanish building blocks ----
    const ES = {
        greet: [`Estimada ${APPLICANT},`, 'Estimado/a postulante,', `Hola ${APPLICANT},`],
        open: [
            'Gracias por tu postulación a {program} de {org}.',
            'Gracias por tu interés y por el tiempo dedicado a postular a {program}.',
            'Nos comunicamos en relación a tu postulación a {program}.'
        ],
        volume: [
            'Este año recibimos {N} postulaciones para apenas {M} plazas disponibles.',
            'La respuesta fue abrumadora: {N} artistas se presentaron en esta edición.',
            'El jurado evaluó un número récord de {N} propuestas de altísima calidad.'
        ],
        reject: [
            'Tras una cuidadosa deliberación, lamentamos informarte que tu propuesta no ha sido seleccionada en esta ocasión.',
            'Con pesar te comunicamos que no podemos ofrecerte un lugar en esta edición.',
            'Lamentablemente, tu proyecto no avanzó a la siguiente etapa del proceso.'
        ],
        soften: [
            'Esta decisión no refleja de ninguna manera la calidad ni el valor de tu trabajo.',
            'El jurado valoró especialmente tu propuesta; la elección fue sumamente difícil.',
            'Muchas propuestas valiosas, como la tuya, no pudieron incluirse por falta de cupo.'
        ],
        encourage: [
            'Te animamos a volver a postularte en una próxima convocatoria.',
            'Esperamos contar con tu propuesta en futuras ediciones.',
            'Te deseamos el mayor de los éxitos en tu práctica artística.'
        ],
        close: ['Saludos cordiales,', 'Con nuestros mejores deseos,', 'Atentamente,', 'Un cordial saludo,'],
        roles: ['Comité de Selección', 'Dirección del Programa', 'Equipo Curatorial', 'Área de Becas', 'Coordinación de Jurado'],
        subject: [
            'Resultado de tu postulación — {program}',
            '{program}: resultados de la selección',
            'Sobre tu postulación a {org}',
            'Novedades de tu postulación',
            'Notificación de convocatoria — {program}'
        ]
    };

    // ---------- helpers ----------
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    const randInt = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
    const chance = (p) => Math.random() < p;

    function slug(s) {
        return s.toLowerCase()
            .normalize('NFD').replace(/[̀-ͯ]/g, '')
            .replace(/&/g, 'and')
            .replace(/[^a-z0-9]+/g, ' ').trim().split(' ').slice(0, 2).join('');
    }
    function fill(t, ctx) {
        return t.replace(/\{(\w+)\}/g, (_, k) => ctx[k]);
    }

    let _id = 0;

    function generateEmail(when) {
        const lang = chance(0.32) ? ES : EN;
        const org = pick(ORGS);
        const program = pick(lang === ES ? PROGRAMS_ES : PROGRAMS_EN);
        const N = randInt(420, 3100);
        const M = randInt(3, 16);
        const ctx = { program, org, N, M };

        const paras = [];
        paras.push(fill(pick(lang.open), ctx));
        if (chance(0.7)) paras.push(fill(pick(lang.volume), ctx));
        paras.push(fill(pick(lang.reject), ctx));
        paras.push(fill(pick(lang.soften), ctx));
        paras.push(fill(pick(lang.encourage), ctx));

        const greet = pick(lang.greet);
        const close = pick(lang.close);
        const role = pick(lang.roles);
        const signer = pick(NAMES);

        const domain = slug(org) + pick(['.org', '.art', '.foundation', '.net']);
        const email = pick(MAIL_PREFIX) + '@' + domain;
        const subject = fill(pick(lang.subject), ctx);

        return {
            id: ++_id,
            org,
            email,
            subject,
            greet,
            body: paras,
            close,
            signer,
            role,
            program,
            to: `${APPLICANT} <${APPLICANT_EMAIL}>`,
            avatar: pick(AVATARS),
            time: when || new Date(),
            read: false,
            starred: false
        };
    }

    // ---------- state ----------
    const state = {
        emails: [],
        folder: 'inbox',
        selectedId: null,
        rejections: BASE_REJECTIONS,
        sound: true
    };

    // ---------- DOM refs ----------
    const $ = (s) => document.querySelector(s);
    const listEl = $('#email-list');
    const readerEl = $('#reader');
    const emptyEl = $('#empty-state');
    const inboxBadge = $('#inbox-badge');
    const rejCountEl = $('#rejection-count');
    const rejCounterEl = $('#rejection-counter');
    const listSub = $('#list-sub');
    const listTitle = $('#list-title');
    const quotaFill = $('#quota-fill');
    const quotaText = $('#quota-text');
    const toastEl = $('#toast');

    // ---------- time formatting ----------
    function relTime(d) {
        const s = (Date.now() - d.getTime()) / 1000;
        if (s < 50) return 'ahora';
        if (s < 3600) return Math.floor(s / 60) + ' min';
        if (s < 86400) return Math.floor(s / 3600) + ' h';
        return Math.floor(s / 86400) + ' d';
    }
    function fullDate(d) {
        return d.toLocaleString('es-AR', {
            weekday: 'short', day: 'numeric', month: 'short',
            hour: '2-digit', minute: '2-digit'
        });
    }
    const initial = (s) => s.replace(/^the\s+/i, '').trim().charAt(0).toUpperCase();
    const avatarHTML = (e) => `<img class="avatar" src="Image/${e.avatar}" alt="" draggable="false">`;

    // ---------- rendering ----------
    function unreadCount() {
        return state.emails.filter((e) => !e.read).length;
    }

    function renderList() {
        let items;
        if (state.folder === 'inbox') items = state.emails;
        else if (state.folder === 'starred') items = state.emails.filter((e) => e.starred);
        else items = [];

        listTitle.textContent = {
            inbox: 'Recibidos', starred: 'Destacados', sent: 'Enviados',
            archive: 'Archivo', trash: 'Papelera'
        }[state.folder];

        if (items.length === 0) {
            const msg = {
                starred: 'Nada destacado.<br>Ninguno valió la pena guardar.',
                sent: 'No enviaste nada.<br>Igual ellos nunca dejan de responder.',
                archive: 'El archivo está vacío.<br>Los rechazos se acumulan, no se ordenan.',
                trash: 'Papelera vacía.<br>No te animaste a tirar ninguno.'
            }[state.folder] || 'No hay mensajes.';
            listEl.innerHTML = `<li class="list-empty">${msg}</li>`;
            listSub.textContent = '';
            return;
        }

        listSub.textContent = unreadCount() + ' sin leer';
        listEl.innerHTML = '';
        items.forEach((e) => {
            const li = document.createElement('li');
            li.className = 'email-item' + (e.read ? '' : ' unread') + (e.id === state.selectedId ? ' active' : '');
            li.style.position = 'relative';
            li.dataset.id = e.id;
            li.innerHTML = `
                ${avatarHTML(e)}
                <div class="email-meta">
                    <div class="email-row1">
                        <span class="email-sender">${e.org}</span>
                        <span class="email-time">${relTime(e.time)}</span>
                    </div>
                    <div class="email-subject">${e.subject}</div>
                    <div class="email-preview">${e.body[0]}</div>
                </div>`;
            li.addEventListener('click', () => openEmail(e.id));
            listEl.appendChild(li);
        });
    }

    function updateBadges() {
        const u = unreadCount();
        inboxBadge.textContent = u;
        inboxBadge.classList.toggle('zero', u === 0);
        rejCountEl.textContent = state.rejections;
        const pct = Math.min(98, 3 + state.emails.length * 1.4);
        quotaFill.style.width = pct + '%';
        quotaText.textContent = `${state.emails.length} rechazos en tu bandeja`;
        document.title = u > 0 ? `(${u}) Artist Rejector` : 'Artist Rejector';
    }

    function openEmail(id) {
        const e = state.emails.find((x) => x.id === id);
        if (!e) return;
        state.selectedId = id;
        if (!e.read) e.read = true;

        emptyEl.classList.add('hidden');
        readerEl.classList.remove('hidden');
        readerEl.innerHTML = `
            <h1 class="reader-subject">${e.subject}</h1>
            <div class="reader-from">
                ${avatarHTML(e)}
                <div class="reader-from-meta">
                    <div class="reader-from-name">${e.org}</div>
                    <div class="reader-from-email">&lt;${e.email}&gt;</div>
                    <div class="reader-to">para ${e.to}</div>
                </div>
                <div class="reader-date">${fullDate(e.time)}</div>
            </div>
            <div class="reader-body">
                <p>${e.greet}</p>
                ${e.body.map((p) => `<p>${p}</p>`).join('')}
                <p class="reader-sign">${e.close}<br>${e.signer}<br>${e.role}, ${e.org}</p>
            </div>
            <div class="reader-actions">
                <button title="No hay respuesta posible.">↩ Responder</button>
                <button title="No hay a quién reenviar esto.">↪ Reenviar</button>
            </div>`;
        readerEl.scrollTop = 0;
        document.getElementById('client').classList.add('reading');
        const rp = document.getElementById('read-pane');
        if (rp) rp.scrollTop = 0;
        renderList();
        updateBadges();
    }

    // ---------- new mail arrival ----------
    function arrive() {
        const e = generateEmail(new Date());
        state.emails.unshift(e);
        state.rejections += 1;

        if (state.folder === 'inbox') renderList();
        updateBadges();

        const feed = document.getElementById('st-feed');
        if (feed) feed.textContent = '<< ' + e.org;

        rejCounterEl.classList.remove('bump');
        void rejCounterEl.offsetWidth;
        rejCounterEl.classList.add('bump');

        showToast(e);
        if (state.sound) ding();

        scheduleNext();
    }

    function scheduleNext() {
        const delay = randInt(ARRIVAL_MIN, ARRIVAL_MAX);
        setTimeout(arrive, delay);
    }

    function showToast(e) {
        toastEl.innerHTML = `
            <div class="toast-icon">✉</div>
            <div class="toast-text">
                <strong>Nuevo rechazo</strong>
                <span>${e.org}</span>
            </div>`;
        toastEl.classList.remove('hidden');
        void toastEl.offsetWidth;
        toastEl.classList.add('show');
        clearTimeout(showToast._t);
        showToast._t = setTimeout(() => toastEl.classList.remove('show'), 4200);
    }

    // ---------- audio (notificación de nuevo mail) ----------
    const SOUNDS = ['Sound/click-baniera-1.mp3', 'Sound/click-baniera-2.mp3'];
    const audioPool = SOUNDS.map((src) => {
        const a = new Audio(src);
        a.preload = 'auto';
        a.volume = 0.6;
        return a;
    });
    function ding() {
        try {
            // clonar permite reproducir aunque suene rápido / superpuesto
            const node = pick(audioPool).cloneNode();
            node.volume = 0.6;
            node.play().catch(() => {});
        } catch (_) { /* no audio */ }
    }

    // ---------- folders ----------
    document.querySelectorAll('.folder').forEach((f) => {
        f.addEventListener('click', () => {
            document.querySelectorAll('.folder').forEach((x) => x.classList.remove('active'));
            f.classList.add('active');
            state.folder = f.dataset.folder;
            renderList();
        });
    });

    // ---------- volver a la bandeja (móvil) ----------
    $('#reader-back').addEventListener('click', () => {
        document.getElementById('client').classList.remove('reading');
        state.selectedId = null;
        renderList();
    });

    // ---------- sound toggle ----------
    $('#sound-toggle').addEventListener('click', (ev) => {
        state.sound = !state.sound;
        ev.currentTarget.textContent = state.sound ? '🔊' : '🔇';
        ev.currentTarget.classList.toggle('muted', !state.sound);
    });

    // ---------- status bar HUD (clock + feed) ----------
    const FEED = [
        'scanning the wired…', 'no acceptances found', 'listening on port 23…',
        're-routing to /dev/null', 'queue depth rising…', 'closing the world…'
    ];
    function pad(n) { return String(n).padStart(2, '0'); }
    function startHud() {
        const clock = document.getElementById('st-clock');
        const feed = document.getElementById('st-feed');
        setInterval(() => {
            const d = new Date();
            if (clock) clock.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
        }, 1000);
        setInterval(() => { if (feed) feed.textContent = pick(FEED); }, 4200);
    }

    // ---------- seed inbox with a small history ----------
    function seed() {
        const offsets = [2, 11, 38, 95, 140, 220, 360, 600, 1440, 2880]; // minutes ago
        offsets.reverse().forEach((min) => {
            const e = generateEmail(new Date(Date.now() - min * 60000));
            if (min > 300) e.read = true;            // los viejos ya los leíste
            state.emails.unshift(e);
        });
    }

    // ---------- desbloqueo de audio (primer gesto del usuario) ----------
    // el navegador bloquea el audio hasta que hay una interacción
    function unlockAudio() {
        audioPool.forEach((a) => {
            try { a.play().then(() => { a.pause(); a.currentTime = 0; }).catch(() => {}); } catch (_) {}
        });
    }
    ['pointerdown', 'keydown', 'touchstart'].forEach((ev) =>
        window.addEventListener(ev, unlockAudio, { once: true })
    );

    // ---------- arranque directo en la bandeja ----------
    const app = $('#app');
    requestAnimationFrame(() => app.classList.add('show'));
    seed();
    renderList();
    updateBadges();
    scheduleNext();
    startHud();

    // refrescar tiempos relativos
    setInterval(renderList, 30000);
})();
