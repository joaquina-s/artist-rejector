/* =========================================================
   ARTIST REJECTOR — simulador de bandeja de rechazos.
   Bilingüe (ES/EN), hilos con escalada, slop, buscaminas.
   ========================================================= */

(function () {
    'use strict';

    // ---------- config ----------
    const ME_NAME = 'vos';
    const ME_EMAIL = 'applicant@artist.world';
    const GAME_HEAT = 4;
    const BASE_REJECTIONS = 247;
    const ARRIVAL_MIN = 6000;
    const ARRIVAL_MAX = 13000;

    // ---------- helpers ----------
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    const randInt = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
    const rIdx = (a) => Math.floor(Math.random() * a.length);
    const chance = (p) => Math.random() < p;
    const sample = (arr, n) => arr.slice().sort(() => Math.random() - 0.5).slice(0, n);
    const sampleIdx = (arr, n) => arr.map((_, i) => i).sort(() => Math.random() - 0.5).slice(0, n);
    function fill(t, ctx) { return t.replace(/\{(\w+)\}/g, (_, k) => ctx[k]); }
    function slug(s) {
        return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
            .replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim().split(' ').slice(0, 2).join('');
    }

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
    const MAIL_PREFIX = ['noreply', 'applications', 'opencall', 'submissions', 'info', 'grants', 'jury'];
    const NAMES = [
        'Dr. M. Albrecht', 'Sofía Reyes', 'J. Mortensen', 'Camille Dubois', 'A. Novak',
        'Lukas Brenner', 'Elena Marchetti', 'Yara Haddad', 'T. Okonkwo', 'Ingrid Vos',
        'P. Lindqvist', 'Renata Gallo', 'H. Nakamura', 'Mateo Duarte'
    ];
    const AVATARS = [
        'colorB1.png', 'colorB2.png', 'colorB3.png', 'colorB4.png',
        'colorB5.png', 'colorB6.png', 'colorB7.png', 'colorB8.png',
        'colorBH1.png', 'colorBH2.png', 'colorBH3.png', 'colorBH4.png',
        'colorBH5.png', 'colorBH6.png', 'colorBH7.png', 'colorBH8.png'
    ];

    const PROGRAMS = {
        en: ['Residency Programme 2026', 'Production Grant', 'International Open Call', 'New Media Fellowship',
            'Emerging Artist Prize', 'Research Grant', 'Summer Residency', 'Project Development Fund',
            'Mobility Fund', 'Winter Open Call'],
        es: ['Programa de Residencia 2026', 'Beca de Producción', 'Convocatoria Internacional', 'Beca de Nuevos Medios',
            'Premio Arte Emergente', 'Beca de Investigación', 'Residencia de Verano', 'Fondo de Desarrollo de Proyectos',
            'Fondo de Movilidad', 'Convocatoria de Invierno']
    };

    // plantillas de rechazo — arrays ES/EN alineados por índice
    const TPL = {
        greet: {
            en: ['Dear Applicant,', 'Dear Artist,', 'To whom it may concern,', 'Dear applicant,'],
            es: ['Estimado/a postulante,', 'Estimado/a artista,', 'A quien corresponda,', 'Hola,']
        },
        open: {
            en: [
                'Thank you for your application to the {program} at {org}.',
                'Thank you for taking the time to submit your proposal to {org}.',
                'Thank you for your application for the {program}.',
                'We are writing to thank you for your application to {org}.',
                'Thank you for submitting your proposal to {org}.',
                'We appreciate the time and effort you put into your submission to the {program}.'
            ],
            es: [
                'Gracias por tu postulación al {program} de {org}.',
                'Gracias por tomarte el tiempo de enviar tu propuesta a {org}.',
                'Gracias por tu postulación al {program}.',
                'Te escribimos para agradecerte tu postulación a {org}.',
                'Gracias por enviar tu propuesta a {org}.',
                'Agradecemos el tiempo y el esfuerzo que pusiste en tu postulación al {program}.'
            ]
        },
        volume: {
            en: [
                'This year we received {N} applications for only {M} available places.',
                'We received an overwhelming number of applications from incredibly talented individuals.',
                'There were far more applications than we could support with our budget.',
                'The jury reviewed nearly {N} applications, which made the decision extremely difficult.',
                'We received {N} strong applications and had the difficult task of selecting just {M}.'
            ],
            es: [
                'Este año recibimos {N} postulaciones para apenas {M} plazas disponibles.',
                'Recibimos una cantidad abrumadora de postulaciones de gente increíblemente talentosa.',
                'Hubo muchas más postulaciones de las que nuestro presupuesto podía sostener.',
                'El jurado revisó casi {N} postulaciones, lo que hizo la decisión sumamente difícil.',
                'Recibimos {N} postulaciones muy fuertes y tuvimos la difícil tarea de elegir solo {M}.'
            ]
        },
        reject: {
            en: [
                'After careful consideration, we regret to inform you that your application was not successful on this occasion.',
                'Unfortunately, we have to inform you that we will not be able to support your project.',
                'We regret to inform you that your proposal was not selected for the {program}.',
                'Ultimately, we made the difficult decision to move forward with other candidates whose profiles align more closely with our current needs.',
                'Your application was rated lower than those of the selected applicants.'
            ],
            es: [
                'Tras una cuidadosa consideración, lamentamos informarte que tu postulación no fue seleccionada en esta ocasión.',
                'Lamentablemente, debemos informarte que no podremos apoyar tu proyecto.',
                'Lamentamos informarte que tu propuesta no fue seleccionada para el {program}.',
                'Finalmente, tomamos la difícil decisión de avanzar con otros candidatos cuyos perfiles se ajustan más a nuestras necesidades actuales.',
                'Tu postulación obtuvo una puntuación menor que la de los seleccionados.'
            ]
        },
        soften: {
            en: [
                'Please don’t be disheartened by this outcome.',
                'This decision does not reflect a lack of interest in you or a lack of quality in your application.',
                'Due to the high volume of submissions, we are unfortunately unable to provide individual feedback.',
                'We genuinely believe that almost all the applications had the potential to be a good fit.',
                'We found your work and proposal both valuable and relevant.'
            ],
            es: [
                'Por favor no te desanimes por este resultado.',
                'Esta decisión no refleja una falta de interés en vos ni una falta de calidad en tu postulación.',
                'Debido al alto volumen de propuestas, lamentablemente no podemos ofrecer devoluciones individuales.',
                'Creemos sinceramente que casi todas las postulaciones tenían el potencial de encajar.',
                'Encontramos tu trabajo y tu propuesta valiosos y relevantes.'
            ]
        },
        encourage: {
            en: [
                'We encourage you to apply again next year.',
                'We wish you the best of luck with your other applications.',
                'We wish you the best for your next steps and hope to hear from you again in the future.',
                'With our best wishes for your artistic endeavours in the coming time.',
                'We have no doubt you will find the right opportunity elsewhere.'
            ],
            es: [
                'Te animamos a volver a postularte el año que viene.',
                'Te deseamos mucha suerte con tus otras postulaciones.',
                'Te deseamos lo mejor en tus próximos pasos y esperamos volver a saber de vos.',
                'Con nuestros mejores deseos para tu labor artística en el tiempo que viene.',
                'No tenemos dudas de que encontrarás la oportunidad indicada en otro lugar.'
            ]
        },
        close: {
            en: ['Warm regards,', 'Kind regards,', 'With best wishes,', 'Kindest regards,', 'Sincerely,'],
            es: ['Saludos cordiales,', 'Un cordial saludo,', 'Con los mejores deseos,', 'Cariños,', 'Atentamente,']
        },
        roles: {
            en: ['the jury', 'Selection Committee', 'Programme Director', 'Curatorial Team', 'Grants Office', 'the team'],
            es: ['el jurado', 'Comité de Selección', 'Dirección del Programa', 'Equipo Curatorial', 'Área de Becas', 'el equipo']
        },
        subject: {
            en: [
                'Outcome of your application — {program}',
                '{program}: selection results',
                'Regarding your application to {org}',
                'Your {program} application',
                'Application update — {program}',
                'A decision regarding your submission'
            ],
            es: [
                'Resultado de tu postulación — {program}',
                '{program}: resultados de la selección',
                'Sobre tu postulación a {org}',
                'Tu postulación al {program}',
                'Novedades de tu postulación — {program}',
                'Una decisión sobre tu propuesta'
            ]
        }
    };

    // ---------- state ----------
    const state = {
        lang: 'en',
        inbox: [],
        sent: [],
        spam: [],
        folder: 'inbox',
        selectedId: null,
        rejections: BASE_REJECTIONS,
        sound: true
    };
    const L = () => state.lang;

    // ---------- i18n UI ----------
    const UI = {
        es: {
            compose: '✎ REDACTAR', inbox: 'Recibidos', sent: 'Enviados', spam: 'Spam',
            rejected: 'RECHAZOS', back: '← BANDEJA',
            emptyMain: 'Seleccioná un mensaje para leer.', emptySub: 'no signal · elegí un nodo',
            unread: 'sin leer', newReject: 'Nuevo rechazo', replyPrompt: '▶ responder',
            quota: 'memoria: ∞ rechazos', to: 'para',
            emptyInbox: 'No hay mensajes.', emptySent: 'Todavía no mandaste súplicas.', emptySpam: 'Sin spam… por ahora.',
            msWin: '✅ HUMANIDAD VERIFICADA — y aún así, rechazada.',
            msLose: '💥 BOOM. no sos una artista real. rechazo confirmado.',
            msPlay: '⚠️ limpiá el campo minado para probar que sos una artista real',
            msFlagOn: '🚩 modo bandera: ON', msFlagOff: '🚩 modo bandera: off', msReset: '↺ reiniciar',
            typing: 'escribiendo'
        },
        en: {
            compose: '✎ COMPOSE', inbox: 'Inbox', sent: 'Sent', spam: 'Spam',
            rejected: 'REJECTED', back: '← INBOX',
            emptyMain: 'Select a message to read.', emptySub: 'no signal · select a node',
            unread: 'unread', newReject: 'New rejection', replyPrompt: '▶ reply',
            quota: 'memory: ∞ rejections', to: 'to',
            emptyInbox: 'No messages.', emptySent: 'You haven’t sent any pleas yet.', emptySpam: 'No spam… yet.',
            msWin: '✅ HUMANITY VERIFIED — and still, rejected.',
            msLose: '💥 BOOM. not a real artist. rejection confirmed.',
            msPlay: '⚠️ clear the minefield to prove you are a real artist',
            msFlagOn: '🚩 flag mode: ON', msFlagOff: '🚩 flag mode: off', msReset: '↺ reset',
            typing: 'typing'
        }
    };
    const t = (k) => UI[state.lang][k];

    // ---------- respuestas del hilo (tu voz) — bilingüe alineado ----------
    const ME_REPLIES = {
        es: [
            ['Gracias por avisarme.', 'Le dediqué muchísimo tiempo a esta aplicación.', '¿Podrían reconsiderar mi postulación?', '¿Habrá otra oportunidad pronto?'],
            ['Trabajé meses en esta propuesta, en serio.', '¿Podrían leerla una vez más? Solo una.', 'Puedo reescribir lo que haga falta.', 'Necesito esto. De verdad lo necesito.'],
            ['Por favor. Mi carrera depende de esto.', 'Hice TODO lo que pedía la convocatoria.', 'Es lo único que tengo. No tengo otra cosa.', '¿Qué hice mal? Decime y lo cambio.'],
            ['POR FAVOR. MI DESTINO DEPENDE DE ESTO.', 'GASTÉ MESES EN ESTO. NO DORMÍ. POR FAVOR.', 'Te lo ruego. Lo que sea. Lo hago.', 'no me hagas esto de nuevo por favor'],
            ['SE LOS SUPLICO. ACÉPTENME. POR FAVOR.', 'puedo trabajar gratis. puedo hacer lo que sea.', 'NO AGUANTO UN RECHAZO MÁS. POR FAVOR.', 'toda mi vida fue para este momento'],
            ['ACÉPTENMEACÉPTENMEACÉPTENMEACÉPTENME', 'VENDO MI ALMA POR UNA RESIDENCIA 🙏', 'POR FAVOR POR FAVOR POR FAVOR POR FAVOR', 'no soy nada sin esto. NADA.']
        ],
        en: [
            ['Thank you for letting me know.', 'I put so much time into this application.', 'Could you reconsider my application?', 'Will there be another opportunity soon?'],
            ['I worked on this proposal for months, honestly.', 'Could you read it one more time? Just once.', 'I can rewrite whatever is needed.', 'I need this. I really need this.'],
            ['Please. My career depends on this.', 'I did EVERYTHING the call asked for.', 'It’s all I have. I have nothing else.', 'What did I do wrong? Tell me and I’ll fix it.'],
            ['PLEASE. MY FATE DEPENDS ON THIS.', 'I SPENT MONTHS ON THIS. I DIDN’T SLEEP. PLEASE.', 'I’m begging you. Anything. I’ll do it.', 'please don’t do this to me again'],
            ['I BEG YOU. ACCEPT ME. PLEASE.', 'i can work for free. i can do anything.', 'I CAN’T TAKE ONE MORE REJECTION. PLEASE.', 'my whole life was for this moment'],
            ['ACCEPTMEACCEPTMEACCEPTMEACCEPTME', 'I’LL SELL MY SOUL FOR A RESIDENCY 🙏', 'PLEASE PLEASE PLEASE PLEASE', 'i am nothing without this. NOTHING.']
        ]
    };

    // respuestas de ELLOS — texto bilingüe + flags por entrada
    const THEM_TEXT = {
        es: [
            [['Gracias por tu mensaje.', 'Esta casilla no se monitorea y las respuestas se generan automáticamente.', 'Tu postulación fue conservada en nuestros registros por un plazo de 0 días.'],
             ['Agradecemos tu entusiasmo.', 'Lamentablemente, nuestra decisión es final y no podemos mantener correspondencia individual sobre los resultados.']],
            [['Como ya te indicamos, la decisión es final.', 'Recibimos un altísimo volumen de mensajes similares y no podemos dar devoluciones individuales.', 'Agradecemos tu comprensión.'],
             ['Entendemos que el rechazo puede ser difícil.', 'Te recordamos amablemente que la decisión del comité merece ser respetada.']],
            [['Ya respondimos esto.', 'Por favor dejá de responder a este hilo.'],
             ['Esto es un rechazo automático.', 'No hay nadie acá. Nunca hubo nadie acá.', 'Por qué seguís escribiendo.']],
            [['ok. NECESITÁS dejar de escribirnos.', 'es la cuarta vez. te lo suplicamos 🙂'],
             ['no leímos tu propuesta.', 'nadie la leyó. NADIE LAS LEE.', 'seguí con tu vida por favor 🙏']],
            [['⚠️ ACTIVIDAD ARTÍSTICA INUSUAL DETECTADA ⚠️', 'para continuar esta conversación tenés que verificar que sos una artista REAL.', 'completá el control de seguridad abajo 👇'],
             ['FELICITACIONES POSTULANTE 🎉🎉🎉', 'fuiste pre-seleccionada para ser RECHAZADA otra vez!!!', 'hacé click EN TODOS LADOS para reclamar tu premio 💸💸💸']]
        ],
        en: [
            [['Thank you for your message.', 'Please note that this inbox is not monitored and replies are generated automatically.', 'Your application has been retained for our records for a period of 0 days.'],
             ['We appreciate your enthusiasm.', 'Unfortunately, our decision is final and we are unable to enter into individual correspondence regarding outcomes.']],
            [['As previously stated, the decision is final.', 'We receive a very high volume of similar messages and cannot provide individual feedback.', 'We kindly ask for your understanding.'],
             ['We understand that rejection can be difficult.', 'We kindly remind you that the committee’s decision deserves to be respected.']],
            [['We have already answered this.', 'Please stop replying to this thread.'],
             ['This is an automated rejection.', 'There is no one here. There has never been anyone here.', 'Why are you still writing.']],
            [['ok. you NEED to stop emailing us.', 'this is the fourth time. we are begging you 🙂'],
             ['we did not read your proposal.', 'nobody read it. NOBODY READS THEM.', 'please move on with your life 🙏']],
            [['⚠️ UNUSUAL ARTISTIC ACTIVITY DETECTED ⚠️', 'to continue this conversation you must verify you are a REAL artist.', 'complete the security check below 👇'],
             ['CONGRATULATIONS APPLICANT 🎉🎉🎉', 'you have been pre-selected to be REJECTED again!!!', 'click EVERYWHERE to claim your prize 💸💸💸']]
        ]
    };
    // flags alineados con THEM_TEXT[*][level][idx]
    const THEM_META = [
        [{}, {}],
        [{}, { ad: true }],
        [{}, { ad: true }],
        [{ slop: true }, { slop: true, ad: true }],
        [{ slop: true }, { slop: true, ad: true }]
    ];

    // ---------- anuncios (fondo = imagen adjunta, estirada) ----------
    const ADS = {
        es: [
            { t: '🔥 CURADORES CALIENTES CERCA TUYO', s: 'quieren ver tu portfolio ESTA NOCHE' },
            { t: 'SOS LA VISITANTE 1.000.000 !!!', s: 'reclamá tu residencia GRATIS 🎉' },
            { t: '¿cansada del rechazo? comprá ARTCOIN 🚀', s: 'la blockchain para artistas REALES' },
            { t: '⚠️ tu propuesta podría estar infectada', s: 'escaneá ahora para eliminar 47 virus' },
            { t: 'vendé NFTs de tus cartas de rechazo 💰', s: 'convertí tu dolor en ingreso pasivo' }
        ],
        en: [
            { t: '🔥 HOT CURATORS IN YOUR AREA', s: 'they want to see your portfolio TONIGHT' },
            { t: 'YOU ARE THE 1,000,000th VISITOR!!!', s: 'claim your FREE residency now 🎉' },
            { t: 'tired of rejection? buy ARTCOIN 🚀', s: 'the blockchain for REAL artists' },
            { t: '⚠️ your proposal may be infected', s: 'scan now to remove 47 viruses' },
            { t: 'sell NFTs of your rejection letters 💰', s: 'turn your pain into passive income' }
        ]
    };
    function renderAd() {
        const i = rIdx(ADS.en);
        const a = ADS[L()][i];
        return `<div class="slop-ad">
            <span class="ad-x">✕</span>
            <div class="ad-txt"><strong>${a.t}</strong><span>${a.s}</span></div>
        </div>`;
    }

    // =====================================================
    //  SPAM — scams obvios (bilingüe)
    // =====================================================
    const SPAM = [
        {
            from: 'Peter Ibsen', email: 'peteribsen.collector@gmail.com', avatar: 'colorBH1.png',
            en: { subject: 'Interested in acquiring your work “DIVER”', body: ['Hello, I hope you\'re doing well.', 'My name is Peter Ibsen. I\'m an art collector and curator. I came across your profile and work on Instagram recently and have been genuinely impressed.', 'I am interested in acquiring the work “DIVER” for my personal collection.', 'Additionally, I\'d love to discuss the possibility of a digital edition or NFT version of your work for our blockchain-based projection and display platform.', 'No pressure at all — I just wanted to reach out personally. Would love to hear your thoughts whenever you have a moment.', 'Warm regards,\nPeter Ibsen\nArt Collector and Curator'] },
            es: { subject: 'Interesado en adquirir tu obra “DIVER”', body: ['Hola, espero que estés muy bien.', 'Mi nombre es Peter Ibsen. Soy coleccionista de arte y curador. Vi tu perfil y tu trabajo en Instagram hace poco y quedé genuinamente impresionado.', 'Estoy interesado en adquirir la obra “DIVER” para mi colección personal.', 'Además, me encantaría hablar de la posibilidad de una edición digital o versión NFT de tu obra para nuestra plataforma de proyección basada en blockchain.', 'Sin ninguna presión — solo quería escribirte personalmente. Me encantaría escuchar tu opinión cuando tengas un momento.', 'Cariños,\nPeter Ibsen\nColeccionista de Arte y Curador'] }
        },
        {
            from: 'Curatorial Dept. — Galerie Méridian', email: 'curatorial@galerie-meridian.art', avatar: 'colorBH3.png',
            en: { subject: 'Invitation: Berlin & Paris international exhibitions', body: ['We are writing from the Curatorial Department at Galerie Méridian.', 'After reviewing your work, we would like to extend an invitation to collaborate with you in our upcoming international exhibitions in Berlin and Paris.', 'BERLIN — Group Show (Aug 21 – Oct 16, 2026), during Berlin Art Week.', 'PARIS — Pop-Up Exhibition (Oct 17 – 30, 2026), near a major cultural landmark, timed with the autumn fairs.', 'Please note that participation in the program requires an entrance fee, which covers the comprehensive services and promotion outlined above.', 'Given the scale of this project, a prompt response would be greatly appreciated.', 'Warm regards,\nThe Curatorial Department'] },
            es: { subject: 'Invitación: exhibiciones internacionales en Berlín y París', body: ['Te escribimos desde el Departamento Curatorial de Galerie Méridian.', 'Tras revisar tu trabajo, queremos extenderte una invitación a colaborar en nuestras próximas exhibiciones internacionales en Berlín y París.', 'BERLÍN — Muestra Colectiva (21 ago – 16 oct 2026), durante la Berlin Art Week.', 'PARÍS — Exhibición Pop-Up (17 – 30 oct 2026), cerca de un importante ícono cultural, coincidiendo con las ferias de otoño.', 'Ten en cuenta que la participación en el programa requiere una cuota de inscripción, que cubre los servicios y la promoción descritos.', 'Dada la escala del proyecto, agradeceríamos una respuesta pronta.', 'Saludos cordiales,\nEl Departamento Curatorial'] }
        },
        {
            from: 'ART GRANT OFFICE', email: 'winner@grant-disbursement.info', avatar: 'colorBH5.png',
            en: { subject: '🎉 YOU WON A $50,000 ART GRANT (FINAL NOTICE)', body: ['CONGRATULATIONS!!! Your name was selected in our INTERNATIONAL ARTIST LOTTERY.', 'You have been awarded a grant of $50,000 USD. To release the funds we only need a small processing fee of $250.', 'CLICK HERE to claim before your prize expires in 24 hours!!!', 'Send the fee via wire transfer or gift cards to secure your grant.', 'Do NOT share this email. This offer is for YOU only.'] },
            es: { subject: '🎉 GANASTE UNA BECA DE ARTE DE $50.000 (ÚLTIMO AVISO)', body: ['¡¡¡FELICITACIONES!!! Tu nombre fue seleccionado en nuestra LOTERÍA INTERNACIONAL DE ARTISTAS.', 'Se te otorgó una beca de $50.000 USD. Para liberar los fondos solo necesitamos una pequeña tarifa de procesamiento de $250.', '¡¡¡HACÉ CLICK ACÁ para reclamar antes de que tu premio expire en 24 horas!!!', 'Enviá la tarifa por transferencia o gift cards para asegurar tu beca.', 'NO compartas este correo. Esta oferta es solo para VOS.'] }
        },
        {
            from: 'Museum of Modern Digital Art', email: 'director@momda-verified.net', avatar: 'colorBH7.png',
            en: { subject: 'Your work has been selected for our permanent collection', body: ['Dear talented artist,', 'Our AI curator has automatically selected YOUR work for the permanent collection of the Museum of Modern Digital Art.', 'To confirm your spot, please verify your identity by logging in with your email and password here: http://momda-verified.net/login', 'Act now — unclaimed spots are given away every hour.', 'Sincerely, The Director'] },
            es: { subject: 'Tu obra fue seleccionada para nuestra colección permanente', body: ['Estimada artista talentosa,', 'Nuestro curador con IA seleccionó automáticamente TU obra para la colección permanente del Museo de Arte Digital Moderno.', 'Para confirmar tu lugar, verificá tu identidad iniciando sesión con tu email y contraseña acá: http://momda-verified.net/login', 'Actuá ya — los lugares no reclamados se regalan cada hora.', 'Atentamente, El Director'] }
        },
        {
            from: 'Prince of the Art World', email: 'royal.patron.007@financenet.biz', avatar: 'colorBH2.png',
            en: { subject: 'CONFIDENTIAL: $10,000,000 art patronage proposal', body: ['Dear friend,', 'I am a wealthy patron of the arts seeking a trustworthy artist to receive a grant of $10,000,000 USD.', 'I only need your full name, address, and bank details to transfer the funds.', 'Please respond urgently. God bless you.'] },
            es: { subject: 'CONFIDENCIAL: propuesta de mecenazgo de $10.000.000', body: ['Estimada amiga,', 'Soy un adinerado mecenas de las artes que busca una artista de confianza para recibir una donación de $10.000.000 USD.', 'Solo necesito tu nombre completo, dirección y datos bancarios para transferir los fondos.', 'Por favor respondé con urgencia. Que Dios te bendiga.'] }
        }
    ];

    // =====================================================
    //  ENVIADOS — súplicas + mails formales (bilingüe)
    // =====================================================
    const SENT = [
        {
            en: { subject: 'Application materials — as requested', body: ['Dear committee,', 'Please find attached my portfolio, CV and project proposal as requested in the open call.', 'I remain at your full disposal for any further information you may need.', 'Kind regards.'] },
            es: { subject: 'Materiales de postulación — según lo solicitado', body: ['Estimado comité,', 'Adjunto mi portfolio, CV y propuesta de proyecto tal como se pedía en la convocatoria.', 'Quedo a completa disposición para cualquier información adicional que necesiten.', 'Saludos cordiales.'] }
        },
        {
            en: { subject: 'Follow-up on my application', body: ['Hello,', 'I know you must be very busy, but I wanted to gently follow up on my application.', 'This opportunity would honestly mean everything to me. I can start immediately and adapt to whatever you need.', 'Thank you so much for your time.'] },
            es: { subject: 'Seguimiento de mi postulación', body: ['Hola,', 'Sé que deben estar muy ocupados, pero quería hacer un seguimiento de mi postulación.', 'Esta oportunidad, sinceramente, significaría todo para mí. Puedo empezar de inmediato y adaptarme a lo que necesiten.', 'Muchísimas gracias por su tiempo.'] }
        },
        {
            en: { subject: 'Re: Re: Re: my proposal', body: ['Hi again,', 'I have attached my proposal once more, just in case it got lost.', 'And again. And again. Please, just read it once. That\'s all I ask.'] },
            es: { subject: 'Re: Re: Re: mi propuesta', body: ['Hola de nuevo,', 'Adjunto mi propuesta una vez más, por las dudas de que se haya perdido.', 'Y otra vez. Y otra vez. Por favor, solo leela una vez. Es todo lo que pido.'] }
        },
        {
            en: { subject: 'Submission — International Open Call', body: ['To the selection team,', 'I am writing to submit my project for your consideration. All required documents are attached.', 'I would be deeply grateful for the opportunity to take part.', 'Sincerely.'] },
            es: { subject: 'Envío — Convocatoria Internacional', body: ['Al equipo de selección,', 'Escribo para enviar mi proyecto a su consideración. Todos los documentos requeridos están adjuntos.', 'Estaría profundamente agradecida por la oportunidad de participar.', 'Atentamente.'] }
        },
        {
            en: { subject: 'please', body: ['i reworked the whole proposal.', 'i changed everything you might not have liked.', 'please. i am so tired. please just say yes.'] },
            es: { subject: 'por favor', body: ['reescribí toda la propuesta.', 'cambié todo lo que quizás no les gustó.', 'por favor. estoy tan cansada. por favor solo digan que sí.'] }
        },
        {
            en: { subject: 'Availability & additional information', body: ['Dear team,', 'Following my application, I wanted to confirm my full availability for the residency dates.', 'I have also attached additional documentation of my recent work.', 'Looking forward to hearing from you.'] },
            es: { subject: 'Disponibilidad e información adicional', body: ['Estimado equipo,', 'A partir de mi postulación, quería confirmar mi total disponibilidad para las fechas de la residencia.', 'También adjunto documentación adicional de mi trabajo reciente.', 'Quedo a la espera de novedades.'] }
        }
    ];

    // ---------- DOM refs ----------
    const $ = (s) => document.querySelector(s);
    const listEl = $('#email-list');
    const readerEl = $('#reader');
    const emptyEl = $('#empty-state');
    const inboxBadge = $('#inbox-badge');
    const spamBadge = $('#spam-badge');
    const rejCountEl = $('#rejection-count');
    const rejCounterEl = $('#rejection-counter');
    const listSub = $('#list-sub');
    const listTitle = $('#list-title');
    const quotaFill = $('#quota-fill');
    const toastEl = $('#toast');

    // ---------- time formatting ----------
    function relTime(d) {
        const s = (Date.now() - d.getTime()) / 1000;
        const es = L() === 'es';
        if (s < 50) return es ? 'ahora' : 'now';
        if (s < 3600) return Math.floor(s / 60) + (es ? ' min' : 'm');
        if (s < 86400) return Math.floor(s / 3600) + ' h';
        return Math.floor(s / 86400) + ' d';
    }
    function fullDate(d) {
        return d.toLocaleString(L() === 'es' ? 'es-AR' : 'en-GB', {
            weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    }
    const avatarSrc = (a) => `Image/${a}`;
    const avatarHTML = (a) => `<img class="avatar" src="Image/${a}" alt="" draggable="false">`;

    // ---------- generación de rechazos ----------
    let _id = 0;
    function generateEmail(when) {
        const org = pick(ORGS);
        const domain = slug(org) + pick(['.org', '.art', '.foundation', '.net']);
        return {
            id: ++_id, kind: 'reject', org,
            email: pick(MAIL_PREFIX) + '@' + domain,
            avatar: pick(AVATARS),
            pIdx: rIdx(PROGRAMS.en),
            N: randInt(420, 3100), M: randInt(3, 16),
            oIdx: rIdx(TPL.open.en),
            vIdx: chance(0.7) ? rIdx(TPL.volume.en) : -1,
            rjIdx: rIdx(TPL.reject.en),
            sfIdx: rIdx(TPL.soften.en),
            enIdx: rIdx(TPL.encourage.en),
            gIdx: rIdx(TPL.greet.en),
            cIdx: rIdx(TPL.close.en),
            roleIdx: rIdx(TPL.roles.en),
            subjIdx: rIdx(TPL.subject.en),
            signer: pick(NAMES),
            time: when || new Date(),
            read: false,
            convo: [], heat: 0, gameShown: false, game: null,
            opts: null, optHeat: -1
        };
    }

    // devuelve {subject, greet, body[], close, role, sign} en el idioma actual
    function viewReject(e) {
        const lang = L();
        const program = PROGRAMS[lang][e.pIdx];
        const ctx = { program, org: e.org, N: e.N, M: e.M };
        const body = [];
        body.push(fill(TPL.open[lang][e.oIdx], ctx));
        if (e.vIdx >= 0) body.push(fill(TPL.volume[lang][e.vIdx], ctx));
        body.push(fill(TPL.reject[lang][e.rjIdx], ctx));
        body.push(fill(TPL.soften[lang][e.sfIdx], ctx));
        body.push(fill(TPL.encourage[lang][e.enIdx], ctx));
        return {
            subject: fill(TPL.subject[lang][e.subjIdx], ctx),
            greet: TPL.greet[lang][e.gIdx],
            body, close: TPL.close[lang][e.cIdx],
            role: TPL.roles[lang][e.roleIdx], sign: true
        };
    }

    // vista unificada de cualquier email
    function emailView(e) {
        if (e.kind === 'reject') {
            const v = viewReject(e);
            return { sender: e.org, email: e.email, avatar: e.avatar, subject: v.subject, preview: v.body[0], view: v };
        }
        const d = e[L()];
        return { sender: e.from || e.org, email: e.email, avatar: e.avatar, subject: d.subject, preview: d.body[0], view: null };
    }

    function currentList() {
        return state.folder === 'sent' ? state.sent : state.folder === 'spam' ? state.spam : state.inbox;
    }
    function findEmail(id) {
        return state.inbox.concat(state.sent, state.spam).find((x) => x.id === id);
    }

    // ---------- rendering: lista ----------
    function unreadCount(arr) { return arr.filter((e) => !e.read).length; }

    function renderList() {
        const items = currentList();
        listTitle.textContent = t(state.folder);

        if (items.length === 0) {
            const key = state.folder === 'sent' ? 'emptySent' : state.folder === 'spam' ? 'emptySpam' : 'emptyInbox';
            listEl.innerHTML = `<li class="list-empty">${t(key)}</li>`;
            listSub.textContent = '';
            return;
        }
        listSub.textContent = unreadCount(items) + ' ' + t('unread');
        listEl.innerHTML = '';
        items.forEach((e) => {
            const v = emailView(e);
            const li = document.createElement('li');
            li.className = 'email-item' + (e.read ? '' : ' unread') + (e.id === state.selectedId ? ' active' : '');
            li.dataset.id = e.id;
            li.innerHTML = `
                ${avatarHTML(v.avatar)}
                <div class="email-meta">
                    <div class="email-row1">
                        <span class="email-sender">${v.sender}</span>
                        <span class="email-time">${relTime(e.time)}</span>
                    </div>
                    <div class="email-subject">${v.subject}</div>
                    <div class="email-preview">${v.preview}</div>
                </div>`;
            li.addEventListener('click', () => openEmail(e.id));
            listEl.appendChild(li);
        });
    }

    function updateBadges() {
        const u = unreadCount(state.inbox);
        inboxBadge.textContent = u;
        inboxBadge.classList.toggle('zero', u === 0);
        const su = unreadCount(state.spam);
        spamBadge.textContent = su;
        spamBadge.classList.toggle('zero', su === 0);
        rejCountEl.textContent = state.rejections;
        quotaFill.style.width = Math.min(98, 3 + state.inbox.length * 1.4) + '%';
        document.title = u > 0 ? `(${u}) Artist Rejector` : 'Artist Rejector';
    }

    // =====================================================
    //  BUSCAMINAS
    // =====================================================
    const G_W = 8, G_H = 8, G_MINES = 10;
    function newGame() {
        const cells = [];
        for (let i = 0; i < G_W * G_H; i++) cells.push({ mine: false, rev: false, flag: false, n: 0 });
        return { type: 'mines', w: G_W, h: G_H, mines: G_MINES, cells, status: 'play', placed: false, flagMode: false };
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
    function renderMines(e) {
        const g = e.game;
        const status = g.status === 'won' ? t('msWin') : g.status === 'lost' ? t('msLose') : t('msPlay');
        const cells = g.cells.map((c, i) => {
            let cls = 'ms-cell', txt = '';
            if (c.rev) { cls += ' rev'; if (c.mine) { cls += ' mine'; txt = '💣'; } else if (c.n > 0) { cls += ' n' + c.n; txt = c.n; } }
            else if (c.flag) { cls += ' flag'; txt = '🚩'; }
            return `<button class="${cls}" data-i="${i}" type="button">${txt}</button>`;
        }).join('');
        return `
            <div class="ms-status">${status}</div>
            <div class="ms-grid" style="grid-template-columns:repeat(${g.w},1fr)">${cells}</div>
            <div class="ms-controls">
                <button class="ms-flag" type="button">${g.flagMode ? t('msFlagOn') : t('msFlagOff')}</button>
                <button class="ms-reset" type="button">${t('msReset')}</button>
            </div>`;
    }
    function bindMines(e, wrap) {
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

    // ---------- juego ----------
    function renderGame(e) { return renderMines(e); }
    function bindGame(e, wrap) { bindMines(e, wrap); }
    function refreshGame(e) {
        const wrap = readerEl.querySelector('#ms-wrap');
        if (!wrap) return;
        wrap.innerHTML = renderGame(e);
        bindGame(e, wrap);
    }

    // =====================================================
    //  LECTOR (hilo)
    // =====================================================
    function msgBlock(who, name, email, avatar, paras, extra, cls) {
        const head = who === 'me'
            ? `<div class="msg-meta"><div class="msg-name">${ME_NAME}</div><div class="msg-email">&lt;${ME_EMAIL}&gt;</div></div>`
            : `${avatarHTML(avatar)}<div class="msg-meta"><div class="msg-name">${name}</div><div class="msg-email">&lt;${email}&gt;</div></div>`;
        return `<div class="msg ${who}${cls || ''}">
            <div class="msg-head">${head}<div class="msg-date"></div></div>
            <div class="msg-body">${paras.map((p) => `<p>${p}</p>`).join('')}</div>
            ${extra || ''}
        </div>`;
    }

    function renderConvoMsg(e, m) {
        if (m.who === 'me') {
            return msgBlock('me', ME_NAME, ME_EMAIL, null, ME_REPLIES[L()][m.level][m.idx] ? [ME_REPLIES[L()][m.level][m.idx]] : [''], '', '');
        }
        const paras = THEM_TEXT[L()][m.level][m.idx];
        const ad = m.ad ? renderAd() : '';
        const game = m.game ? `<div class="minesweeper" id="ms-wrap">${renderGame(e)}</div>` : '';
        return msgBlock('them', e.org, e.email, e.avatar, paras, ad + game, m.slop ? ' slop' : '');
    }

    function renderReplyBox(e) {
        const lvl = Math.min(e.heat, ME_REPLIES[L()].length - 1);
        if (e.optHeat !== e.heat) { e.opts = sampleIdx(ME_REPLIES.en[lvl], 3); e.optHeat = e.heat; }
        const opts = e.opts.map((i) =>
            `<button class="reply-opt" type="button" data-level="${lvl}" data-idx="${i}">${ME_REPLIES[L()][lvl][i]}</button>`
        ).join('');
        return `<div class="reply-box">
            <div class="reply-prompt hud">${t('replyPrompt')}</div>
            <div class="reply-options">${opts}</div>
        </div>`;
    }

    function renderReader(e) {
        const v = emailView(e);
        // encabezado del primer mensaje
        let html = `<h1 class="reader-subject">${v.subject}</h1>`;

        if (e.kind === 'reject') {
            const rv = v.view;
            const original = `<div class="msg them">
                <div class="msg-head">
                    ${avatarHTML(e.avatar)}
                    <div class="msg-meta"><div class="msg-name">${e.org}</div><div class="msg-email">&lt;${e.email}&gt;</div></div>
                    <div class="msg-date">${fullDate(e.time)}</div>
                </div>
                <div class="msg-body">
                    <p>${rv.greet}</p>
                    ${rv.body.map((p) => `<p>${p}</p>`).join('')}
                    <p class="reader-sign">${rv.close}<br>${e.signer}<br>${rv.role}, ${e.org}</p>
                </div>
            </div>`;
            const convo = e.convo.map((m) => renderConvoMsg(e, m)).join('');
            const typing = e.awaiting
                ? `<div class="msg them typing"><div class="msg-body"><span class="dots">${t('typing')}<span>.</span><span>.</span><span>.</span></span></div></div>`
                : '';
            const reply = e.awaiting ? '' : renderReplyBox(e);
            html += `<div class="reader-thread${e.heat >= 4 ? ' sloppy' : ''}">${original}${convo}${typing}</div>${reply}`;
        } else {
            const d = e[L()];
            html += `<div class="reader-thread">
                <div class="msg them${e.kind === 'spam' ? ' spammy' : ''}">
                    <div class="msg-head">
                        ${avatarHTML(e.avatar)}
                        <div class="msg-meta"><div class="msg-name">${v.sender}</div><div class="msg-email">&lt;${e.email}&gt;</div></div>
                        <div class="msg-date">${fullDate(e.time)}</div>
                    </div>
                    <div class="msg-body">${d.body.map((p) => `<p>${p}</p>`).join('')}</div>
                </div>
            </div>`;
        }

        readerEl.innerHTML = html;
        readerEl.querySelectorAll('.reply-opt').forEach((btn) => {
            btn.addEventListener('click', () => sendReply(e, +btn.dataset.level, +btn.dataset.idx));
        });
        const wrap = readerEl.querySelector('#ms-wrap');
        if (wrap) bindGame(e, wrap);
    }

    function scrollReaderBottom() {
        const rp = document.getElementById('read-pane');
        if (rp) rp.scrollTop = rp.scrollHeight;
    }

    function sendReply(e, level, idx) {
        if (e.awaiting) return;
        e.convo.push({ who: 'me', level, idx, time: new Date() });
        e.heat += 1;
        e.awaiting = true;
        renderReader(e);
        scrollReaderBottom();

        setTimeout(() => {
            const lvl = Math.min(e.heat, THEM_TEXT.en.length);   // 1..5
            const entryIdx = rIdx(THEM_TEXT.en[lvl - 1]);
            const meta = THEM_META[lvl - 1][entryIdx] || {};
            const msg = {
                who: 'them', level: lvl - 1, idx: entryIdx,
                slop: !!meta.slop, ad: !!meta.ad, game: false, time: new Date()
            };
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
        }, 1300 + Math.random() * 1800);
    }

    function openEmail(id) {
        const e = findEmail(id);
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

    // ---------- llegada de rechazos ----------
    function arrive() {
        const e = generateEmail(new Date());
        state.inbox.unshift(e);
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
    function scheduleNext() { setTimeout(arrive, randInt(ARRIVAL_MIN, ARRIVAL_MAX)); }

    function showToast(e) {
        toastEl.innerHTML = `
            <div class="toast-icon">✉</div>
            <div class="toast-text"><strong>${t('newReject')}</strong><span>${e.org}</span></div>`;
        toastEl.classList.remove('hidden');
        void toastEl.offsetWidth;
        toastEl.classList.add('show');
        clearTimeout(showToast._t);
        showToast._t = setTimeout(() => toastEl.classList.remove('show'), 4200);
    }

    // ---------- audio ----------
    const SOUNDS = ['Sound/click-baniera-1.mp3', 'Sound/click-baniera-2.mp3'];
    const audioPool = SOUNDS.map((src) => { const a = new Audio(src); a.preload = 'auto'; a.volume = 0.6; return a; });
    function ding() {
        try { const n = pick(audioPool).cloneNode(); n.volume = 0.6; n.play().catch(() => {}); } catch (_) {}
    }

    // ---------- folders ----------
    document.querySelectorAll('.folder').forEach((f) => {
        f.addEventListener('click', () => {
            document.querySelectorAll('.folder').forEach((x) => x.classList.remove('active'));
            f.classList.add('active');
            state.folder = f.dataset.folder;
            state.selectedId = null;
            document.getElementById('client').classList.remove('reading');
            emptyEl.classList.remove('hidden');
            readerEl.classList.add('hidden');
            renderList();
        });
    });

    // ---------- volver (móvil) ----------
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

    // ---------- idioma ----------
    function applyLang() {
        document.documentElement.lang = state.lang;
        document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
        $('#lang-toggle').textContent = state.lang === 'es' ? 'EN' : 'ES';
        renderList();
        const cur = state.selectedId ? findEmail(state.selectedId) : null;
        if (cur && !readerEl.classList.contains('hidden')) renderReader(cur);
        updateBadges();
    }
    $('#lang-toggle').addEventListener('click', () => {
        state.lang = state.lang === 'es' ? 'en' : 'es';
        applyLang();
    });

    // ---------- HUD status bar ----------
    const FEED = ['scanning the wired…', 'no acceptances found', 'listening on port 23…', 're-routing to /dev/null', 'queue depth rising…', 'closing the world…'];
    const pad = (n) => String(n).padStart(2, '0');
    function startHud() {
        const clock = document.getElementById('st-clock');
        const feed = document.getElementById('st-feed');
        setInterval(() => {
            const d = new Date();
            if (clock) clock.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
        }, 1000);
        setInterval(() => { if (feed) feed.textContent = pick(FEED); }, 4200);
    }

    // ---------- seed ----------
    function seedInbox() {
        const offsets = [2, 11, 38, 95, 140, 220, 360, 600, 1440, 2880];
        offsets.reverse().forEach((min) => {
            const e = generateEmail(new Date(Date.now() - min * 60000));
            if (min > 300) e.read = true;
            state.inbox.unshift(e);
        });
    }
    function seedSpam() {
        SPAM.forEach((s, k) => {
            state.spam.unshift(Object.assign({ id: ++_id, kind: 'spam', read: k > 1, time: new Date(Date.now() - (k * 300 + 30) * 60000) }, s));
        });
    }
    function seedSent() {
        SENT.forEach((s, k) => {
            const org = pick(ORGS);
            state.sent.unshift(Object.assign({
                id: ++_id, kind: 'sent', read: true, org,
                email: pick(MAIL_PREFIX) + '@' + slug(org) + '.org',
                avatar: pick(AVATARS), time: new Date(Date.now() - (k * 200 + 60) * 60000)
            }, s));
        });
    }

    // ---------- audio unlock ----------
    function unlockAudio() {
        audioPool.forEach((a) => { try { a.play().then(() => { a.pause(); a.currentTime = 0; }).catch(() => {}); } catch (_) {} });
    }
    ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => window.addEventListener(ev, unlockAudio, { once: true }));

    // ---------- arranque ----------
    const app = $('#app');
    requestAnimationFrame(() => app.classList.add('show'));
    seedInbox();
    seedSpam();
    seedSent();
    applyLang();          // pinta UI + lista en el idioma inicial
    updateBadges();
    scheduleNext();
    startHud();
    setInterval(renderList, 30000);
})();
