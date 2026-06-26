/* =========================================================
   ARTIST REJECTOR — lógica del simulador de bandeja.
   Los rechazos se generan proceduralmente y nunca paran.
   ========================================================= */

(function () {
    'use strict';

    // ---------- config ----------
    const ME_NAME = 'vos';                   // tu identidad en el hilo (sin nombre real)
    const ME_EMAIL = 'applicant@artist.world';
    const GAME_HEAT = 4;                      // a partir de cuántas respuestas aparece el buscaminas
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
        greet: ['Dear Applicant,', 'Dear Artist,', 'To whom it may concern,', 'Dear Sir or Madam,'],
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
        greet: ['Estimado/a postulante,', 'Estimado/a artista,', 'A quien corresponda,'],
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
            to: `${ME_NAME} <${ME_EMAIL}>`,
            avatar: pick(AVATARS),
            time: when || new Date(),
            read: false,
            starred: false,
            convo: [],          // hilo de respuestas (vos <-> ellos)
            heat: 0,            // sube con cada respuesta -> el tono se pone más agresivo
            gameShown: false,
            game: null
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

    // =====================================================
    //  HILO DE RESPUESTAS — escalada de tono + slop + juegos
    // =====================================================

    const sample = (arr, n) => arr.slice().sort(() => Math.random() - 0.5).slice(0, n);

    // tus opciones de respuesta (tu voz) — arco de desesperación creciente
    const ME_REPLIES = [
        [ // 0 — compuesta, con esperanza
            'Gracias por avisarme.',
            'Le dediqué muchísimo tiempo a esta aplicación.',
            '¿Podrían reconsiderar mi postulación?',
            '¿Habrá otra oportunidad pronto?'
        ],
        [ // 1 — ansiosa, justificándose
            'Trabajé meses en esta propuesta, en serio.',
            '¿Podrían leerla una vez más? Solo una.',
            'Puedo reescribir lo que haga falta.',
            'Necesito esto. De verdad lo necesito.'
        ],
        [ // 2 — suplicando
            'Por favor. Mi carrera depende de esto.',
            'Hice TODO lo que pedía la convocatoria.',
            'Es lo único que tengo. No tengo otra cosa.',
            '¿Qué hice mal? Decime y lo cambio.'
        ],
        [ // 3 — desesperada, mayúsculas asomando
            'POR FAVOR. MI DESTINO DEPENDE DE ESTO.',
            'GASTÉ MESES EN ESTO. NO DORMÍ. POR FAVOR.',
            'Te lo ruego. Lo que sea. Lo hago.',
            'no me hagas esto de nuevo por favor'
        ],
        [ // 4 — quebrándose
            'SE LOS SUPLICO. ACÉPTENME. POR FAVOR.',
            'puedo trabajar gratis. puedo hacer lo que sea.',
            'NO AGUANTO UN RECHAZO MÁS. POR FAVOR.',
            'toda mi vida fue para este momento'
        ],
        [ // 5 — desesperación total
            'ACÉPTENMEACÉPTENMEACÉPTENMEACÉPTENME',
            'VENDO MI ALMA POR UNA RESIDENCIA 🙏',
            'POR FAVOR POR FAVOR POR FAVOR POR FAVOR',
            'no soy nada sin esto. NADA.'
        ]
    ];

    // respuestas de ELLOS por nivel (0=primer reply). slop/ad opcional.
    const THEM = [
        [ // nivel 1 — auto-reply corporativo
            { body: ['Thank you for your message.', 'Please note that this inbox is not monitored and replies are generated automatically.', 'Your application has been retained for our records for a period of 0 days.'] },
            { body: ['We appreciate your enthusiasm.', 'Unfortunately, our decision is final and we are unable to enter into individual correspondence regarding outcomes.'] }
        ],
        [ // nivel 2 — pasivo-agresivo
            { body: ['As previously stated, the decision is final.', 'We receive a very high volume of similar messages and cannot provide individual feedback.', 'We kindly ask for your understanding.'] },
            { body: ['We understand that rejection can be difficult.', 'We kindly remind you that the committee’s decision deserves to be respected.'], ad: true }
        ],
        [ // nivel 3 — irritado
            { body: ['We have already answered this.', 'Please stop replying to this thread.'] },
            { body: ['This is an automated rejection.', 'There is no one here. There has never been anyone here.', 'Why are you still writing.'], ad: true }
        ],
        [ // nivel 4 — hostil
            { body: ['ok. you NEED to stop emailing us.', 'this is the fourth time. we are begging you 🙂'], slop: true },
            { body: ['we did not read your proposal.', 'nobody read it. NOBODY READS THEM.', 'please move on with your life 🙏'], slop: true, ad: true }
        ],
        [ // nivel 5+ — slop total
            { body: ['⚠️ UNUSUAL ARTISTIC ACTIVITY DETECTED ⚠️', 'to continue this conversation you must verify you are a REAL artist.', 'complete the security check below 👇'], slop: true },
            { body: ['CONGRATULATIONS APPLICANT 🎉🎉🎉', 'you have been pre-selected to be REJECTED again!!!', 'click EVERYWHERE to claim your prize 💸💸💸'], slop: true, ad: true },
            { body: ['hello applicant. it is me. the committee.', 'we live in the inbox now. we cannot leave.', 'join us. apply forever. 🕳️'], slop: true }
        ]
    ];

    const ADS = [
        { t: '🔥 HOT CURATORS IN YOUR AREA', s: 'they want to see your portfolio TONIGHT' },
        { t: 'YOU ARE THE 1.000.000th VISITOR!!!', s: 'claim your FREE residency now 🎉' },
        { t: 'tired of rejection? buy ARTCOIN 🚀', s: 'the blockchain for REAL artists' },
        { t: '⚠️ your proposal may be infected', s: 'scan now to remove 47 viruses' },
        { t: 'sell NFTs of your rejection letters 💰', s: 'turn your pain into passive income' },
        { t: 'BECOME A GENIUS IN 7 DAYS', s: 'this one weird trick curators HATE' },
        { t: 'singles near you also got rejected', s: 'cry together — match now ❤️' }
    ];

    function renderAd() {
        const a = pick(ADS);
        return `<div class="slop-ad">
            <span class="ad-x">✕</span>
            <img src="Image/${pick(AVATARS)}" alt="">
            <div class="ad-txt"><strong>${a.t}</strong><span>${a.s}</span></div>
        </div>`;
    }

    // ---------- buscaminas embebido ----------
    const G_W = 8, G_H = 8, G_MINES = 10;

    function newGame() {
        const cells = [];
        for (let i = 0; i < G_W * G_H; i++) cells.push({ mine: false, rev: false, flag: false, n: 0 });
        return { w: G_W, h: G_H, mines: G_MINES, cells, status: 'play', placed: false, flagMode: false };
    }
    function gNeighbors(g, i) {
        const x = i % g.w, y = (i / g.w) | 0, out = [];
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= g.w || ny >= g.h) continue;
            out.push(ny * g.w + nx);
        }
        return out;
    }
    function gPlace(g, safe) {
        let placed = 0;
        while (placed < g.mines) {
            const i = randInt(0, g.cells.length - 1);
            if (i === safe || g.cells[i].mine) continue;
            g.cells[i].mine = true; placed++;
        }
        g.cells.forEach((c, i) => { c.n = c.mine ? -1 : gNeighbors(g, i).filter((j) => g.cells[j].mine).length; });
        g.placed = true;
    }
    function gReveal(g, i) {
        const c = g.cells[i];
        if (c.rev || c.flag) return;
        c.rev = true;
        if (c.mine) { g.status = 'lost'; g.cells.forEach((x) => { if (x.mine) x.rev = true; }); return; }
        if (c.n === 0) gNeighbors(g, i).forEach((j) => gReveal(g, j));
    }
    function gClick(g, i) {
        if (g.status !== 'play') return;
        if (g.flagMode) { if (!g.cells[i].rev) g.cells[i].flag = !g.cells[i].flag; return; }
        if (!g.placed) gPlace(g, i);
        gReveal(g, i);
        if (g.status === 'play' && g.cells.every((c) => c.mine || c.rev)) g.status = 'won';
    }
    function renderGame(e) {
        const g = e.game;
        const status = g.status === 'won' ? '✅ HUMANIDAD VERIFICADA — y aún así, rechazada.'
            : g.status === 'lost' ? '💥 BOOM. no sos una artista real. rechazo confirmado.'
            : '⚠️ limpiá el campo minado para probar que sos una artista real';
        const cells = g.cells.map((c, i) => {
            let cls = 'ms-cell', t = '';
            if (c.rev) { cls += ' rev'; if (c.mine) { cls += ' mine'; t = '💣'; } else if (c.n > 0) { cls += ' n' + c.n; t = c.n; } }
            else if (c.flag) { cls += ' flag'; t = '🚩'; }
            return `<button class="${cls}" data-i="${i}" type="button">${t}</button>`;
        }).join('');
        return `
            <div class="ms-status">${status}</div>
            <div class="ms-grid" style="grid-template-columns:repeat(${g.w},1fr)">${cells}</div>
            <div class="ms-controls">
                <button class="ms-flag" type="button">${g.flagMode ? '🚩 modo bandera: ON' : '🚩 modo bandera: off'}</button>
                <button class="ms-reset" type="button">↺ reiniciar</button>
            </div>`;
    }
    function refreshGame(e) {
        const wrap = readerEl.querySelector('#ms-wrap');
        if (!wrap) return;
        wrap.innerHTML = renderGame(e);
        bindGame(e, wrap);
    }
    function bindGame(e, wrap) {
        const grid = wrap.querySelector('.ms-grid');
        if (grid) {
            grid.addEventListener('click', (ev) => {
                const b = ev.target.closest('.ms-cell'); if (!b) return;
                gClick(e.game, +b.dataset.i); refreshGame(e);
            });
            grid.addEventListener('contextmenu', (ev) => {
                ev.preventDefault();
                const b = ev.target.closest('.ms-cell'); if (!b) return;
                const c = e.game.cells[+b.dataset.i];
                if (e.game.status === 'play' && !c.rev) { c.flag = !c.flag; refreshGame(e); }
            });
        }
        const f = wrap.querySelector('.ms-flag'); if (f) f.addEventListener('click', () => { e.game.flagMode = !e.game.flagMode; refreshGame(e); });
        const r = wrap.querySelector('.ms-reset'); if (r) r.addEventListener('click', () => { e.game = newGame(); refreshGame(e); });
    }

    // ---------- render de un mensaje del hilo ----------
    function renderMessage(e, m) {
        if (m.who === 'me') {
            return `<div class="msg me">
                <div class="msg-head">
                    <div class="msg-meta"><div class="msg-name">${ME_NAME}</div><div class="msg-email">&lt;${ME_EMAIL}&gt;</div></div>
                    <div class="msg-date">${fullDate(m.time)}</div>
                </div>
                <div class="msg-body">${m.body.map((p) => `<p>${p}</p>`).join('')}</div>
            </div>`;
        }
        const ad = m.ad ? renderAd() : '';
        const game = m.game ? `<div class="minesweeper" id="ms-wrap">${renderGame(e)}</div>` : '';
        return `<div class="msg them${m.slop ? ' slop' : ''}">
            <div class="msg-head">
                <img class="avatar" src="Image/${m.avatar}" alt="" draggable="false">
                <div class="msg-meta"><div class="msg-name">${m.name}</div><div class="msg-email">&lt;${m.email}&gt;</div></div>
                <div class="msg-date">${fullDate(m.time)}</div>
            </div>
            <div class="msg-body">${m.body.map((p) => `<p>${p}</p>`).join('')}</div>
            ${ad}${game}
        </div>`;
    }

    function renderReplyBox(e) {
        const lvl = Math.min(e.heat, ME_REPLIES.length - 1);
        const opts = sample(ME_REPLIES[lvl], 3);
        return `<div class="reply-box">
            <div class="reply-prompt hud">▶ responder</div>
            <div class="reply-options">
                ${opts.map((o) => `<button class="reply-opt" type="button">${o}</button>`).join('')}
            </div>
        </div>`;
    }

    function renderReader(e) {
        const original = `<div class="msg them">
            <div class="msg-head">
                ${avatarHTML(e)}
                <div class="msg-meta"><div class="msg-name">${e.org}</div><div class="msg-email">&lt;${e.email}&gt;</div></div>
                <div class="msg-date">${fullDate(e.time)}</div>
            </div>
            <div class="msg-body">
                <p>${e.greet}</p>
                ${e.body.map((p) => `<p>${p}</p>`).join('')}
                <p class="reader-sign">${e.close}<br>${e.signer}<br>${e.role}, ${e.org}</p>
            </div>
        </div>`;
        const convo = e.convo.map((m) => renderMessage(e, m)).join('');
        const typing = e.awaiting
            ? `<div class="msg them typing"><div class="msg-body"><span class="dots">escribiendo<span>.</span><span>.</span><span>.</span></span></div></div>`
            : '';
        const reply = e.awaiting ? '' : renderReplyBox(e);
        readerEl.innerHTML = `
            <h1 class="reader-subject">${e.subject}</h1>
            <div class="reader-thread${e.heat >= 4 ? ' sloppy' : ''}">
                ${original}${convo}${typing}
            </div>
            ${reply}`;
        // bind reply options
        readerEl.querySelectorAll('.reply-opt').forEach((btn) => {
            btn.addEventListener('click', () => sendReply(e, btn.textContent));
        });
        const wrap = readerEl.querySelector('#ms-wrap');
        if (wrap) bindGame(e, wrap);
    }

    function scrollReaderBottom() {
        const rp = document.getElementById('read-pane');
        if (rp) rp.scrollTop = rp.scrollHeight;
    }

    function sendReply(e, text) {
        if (e.awaiting) return;
        e.convo.push({ who: 'me', body: [text], time: new Date() });
        e.heat += 1;
        e.awaiting = true;
        renderReader(e);
        scrollReaderBottom();

        const delay = 1300 + Math.random() * 1800;
        setTimeout(() => {
            const lvl = Math.min(e.heat, THEM.length);     // 1..5
            const tmpl = pick(THEM[lvl - 1]);
            const msg = {
                who: 'them', name: e.org, email: e.email, avatar: e.avatar,
                body: tmpl.body.slice(), slop: !!tmpl.slop, ad: !!tmpl.ad, game: false,
                time: new Date()
            };
            // el buscaminas aparece una vez cuando la cosa ya es slop
            if (e.heat >= GAME_HEAT && !e.gameShown) {
                msg.game = true; msg.slop = true;
                e.gameShown = true; e.game = newGame();
            }
            e.convo.push(msg);
            e.awaiting = false;
            state.rejections += 1;

            if (state.selectedId === e.id) { renderReader(e); scrollReaderBottom(); }
            rejCounterEl.classList.remove('bump');
            void rejCounterEl.offsetWidth;
            rejCounterEl.classList.add('bump');
            updateBadges();
            if (state.sound) ding();
        }, delay);
    }

    function openEmail(id) {
        const e = state.emails.find((x) => x.id === id);
        if (!e) return;
        state.selectedId = id;
        if (!e.read) e.read = true;

        emptyEl.classList.add('hidden');
        readerEl.classList.remove('hidden');
        renderReader(e);
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
