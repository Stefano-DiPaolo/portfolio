// =====================================================================
// ===== ORDINA LA TUA TORTA =====
// =====================================================================

// --- Configurazione: modifica qui prezzi, limiti e indirizzo email ---
const ORDER_CONFIG = {
    // Indirizzo che riceve gli ordini (tramite il servizio gratuito FormSubmit.co).
    // Al PRIMO ordine FormSubmit invia a questo indirizzo una mail di attivazione da confermare.
    email: 'stefix25@gmail.com',
    pricePerKg: 22,          // € al chilo
    kgPerPerson: 0.12,       // ~120 g a porzione
    cm2PerPerson: 32,        // superficie di torta per porzione (cm²)
    minPeople: 4,
    maxPeople: 60,
    step: 2,
    defaultPeople: 8,
    minDaysNotice: 3,        // giorni minimi di preavviso per il ritiro
};

// Per aggiungere una torta: aggiungi un oggetto qui sotto.
// Se non hai ancora la foto lascia img: '' e verrà mostrato un colore di sfondo.
const CAKES = [
    { id: 'tiramisu',     name: 'Tiramisù',                      img: "images/tiramisu'.JPG",    fallback: 'linear-gradient(160deg,#c9a27a,#6b4a2f)' },
    { id: 'sacher',       name: 'Sacher',                        img: '',                        fallback: 'radial-gradient(circle at 35% 30%,#5a3221,#2a140b 70%)' },
    { id: 'foresta-nera', name: 'Foresta Nera',                  img: 'images/foresta nera.JPG', fallback: 'linear-gradient(160deg,#4a2418,#1e0f08)' },
    { id: 'crostata',     name: 'Crostata con crema pasticcera', img: '',                        fallback: 'radial-gradient(circle at 50% 50%,#f6d98a 0 55%,#c98d3c 56% 100%)' },
];

(function initOrder() {
    const form = document.getElementById('orderForm');
    if (!form) return;

    const $ = (id) => document.getElementById(id);
    const cakeOptions = $('cakeOptions');
    const peopleOut   = $('peopleValue');
    const minusBtn    = $('peopleMinus');
    const plusBtn     = $('peoplePlus');
    const plate       = $('previewPlate');
    const cakeEl      = $('previewCake');
    const previewImg  = $('previewImg');
    const previewText = $('previewText');
    const cakeText    = $('cakeText');
    const pickupDate  = $('pickupDate');
    const formError   = $('formError');

    const modal       = $('orderModal');
    const modalReview = $('modalReview');
    const modalResult = $('modalResult');

    let people = ORDER_CONFIG.defaultPeople;

    const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });
    const kgText = (kg) => kg.toFixed(1).replace('.', ',') + ' kg';

    // --- Genera le card delle torte ---
    cakeOptions.innerHTML = CAKES.map((c, i) => `
        <label class="cake-option">
            <input type="radio" name="torta" value="${c.id}" ${i === 0 ? 'checked' : ''}>
            <span class="cake-card">
                <span class="cake-thumb" style="background:${c.fallback}">
                    ${c.img ? `<img src="${c.img}" alt="" loading="lazy">` : ''}
                </span>
                <span class="cake-name">${c.name}</span>
            </span>
        </label>`).join('');

    // --- Data minima di ritiro ---
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + ORDER_CONFIG.minDaysNotice);
    const pad = (n) => String(n).padStart(2, '0');
    pickupDate.min = `${minDate.getFullYear()}-${pad(minDate.getMonth() + 1)}-${pad(minDate.getDate())}`;

    // --- Calcoli ---
    function getCake()  { return CAKES.find(c => c.id === form.torta.value) || CAKES[0]; }
    function getShape() { return form.forma.value; }

    function compute() {
        const kg    = people * ORDER_CONFIG.kgPerPerson;
        const price = Math.ceil(kg * ORDER_CONFIG.pricePerKg * 2) / 2; // arrotonda ai 50 cent
        const area  = people * ORDER_CONFIG.cm2PerPerson;
        const even  = (n) => Math.max(2, Math.round(n / 2) * 2);
        let size, w, h;
        if (getShape() === 'rotonda') {
            const d = even(Math.sqrt((4 * area) / Math.PI));
            size = `Ø ${d} cm`; w = h = d;
        } else {
            // rettangolo in proporzione 3:2
            w = even(Math.sqrt(area * 1.5));
            h = even(w / 1.5);
            size = `${w} × ${h} cm`;
        }
        return { kg, price, size, w, h };
    }

    // lato più lungo possibile (rettangolo col massimo delle persone)
    const MAX_DIM = Math.sqrt(ORDER_CONFIG.maxPeople * ORDER_CONFIG.cm2PerPerson * 1.5);

    // --- Aggiorna anteprima e riepilogo ---
    function update() {
        const cake  = getCake();
        const shape = getShape();
        const r     = compute();

        peopleOut.textContent = people;
        minusBtn.disabled = people <= ORDER_CONFIG.minPeople;
        plusBtn.disabled  = people >= ORDER_CONFIG.maxPeople;

        // Foto + forma + grandezza proporzionale
        if (cake.img) {
            previewImg.src = cake.img;
            previewImg.alt = cake.name;
            previewImg.hidden = false;
        } else {
            previewImg.removeAttribute('src');
            previewImg.alt = '';
            previewImg.hidden = true;
        }
        cakeEl.style.background = cake.fallback;
        cakeEl.classList.toggle('is-rect', shape === 'rettangolare');
        plate.classList.toggle('is-rect', shape === 'rettangolare');

        // larghezza dal 35% al 92% del piatto in base alla dimensione reale
        const scale = 0.35 + 0.57 * (Math.max(r.w, r.h) / MAX_DIM);
        cakeEl.style.width = `${(scale * 100).toFixed(1)}%`;
        cakeEl.style.aspectRatio = `${r.w} / ${r.h}`;

        previewText.textContent = cakeText.value.trim();

        $('previewName').textContent = cake.name;
        $('specPeople').textContent  = `${people} persone`;
        $('specSize').textContent    = r.size;
        $('specWeight').textContent  = '~' + kgText(r.kg);
        $('specPrice').textContent   = euro.format(r.price);
    }

    $('peopleHint').textContent =
        `Da ${ORDER_CONFIG.minPeople} a ${ORDER_CONFIG.maxPeople} persone. Per eventi più grandi scrivilo nel messaggio.`;

    minusBtn.addEventListener('click', () => {
        people = Math.max(ORDER_CONFIG.minPeople, people - ORDER_CONFIG.step); update();
    });
    plusBtn.addEventListener('click', () => {
        people = Math.min(ORDER_CONFIG.maxPeople, people + ORDER_CONFIG.step); update();
    });
    form.addEventListener('change', update);
    cakeText.addEventListener('input', update);

    // --- Raccolta dati ---
    function collect() {
        const fd    = new FormData(form);
        const val   = (k) => (fd.get(k) || '').toString().trim();
        const cake  = getCake();
        const r     = compute();
        const allergeni = fd.getAll('allergeni');
        if (val('allergeni_altro')) allergeni.push(val('allergeni_altro'));
        const date = val('data_ritiro');
        return {
            'Torta':          cake.name,
            'Persone':        String(people),
            'Forma':          getShape() === 'rotonda' ? 'Rotonda' : 'Rettangolare',
            'Dimensioni':     r.size,
            'Peso stimato':   kgText(r.kg),
            'Prezzo stimato': euro.format(r.price),
            'Occasione':      val('occasione'),
            'Data ritiro':    date ? new Date(date + 'T12:00').toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '',
            'Scritta':        val('scritta') || '—',
            'Decorazione':    val('decorazione') || '—',
            'Nome':           `${val('nome')} ${val('cognome')}`,
            'Email':          val('email'),
            'Telefono':       val('telefono'),
            'Allergeni':      allergeni.length ? allergeni.join(', ') : 'Nessuno',
            'Messaggio':      val('messaggio') || '—',
        };
    }

    // --- Validazione + apertura modale ---
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        formError.textContent = '';
        form.classList.add('was-validated');
        if (!form.checkValidity()) {
            const firstInvalid = form.querySelector('input:invalid, select:invalid, textarea:invalid');
            formError.textContent = 'Compila tutti i campi obbligatori (*) prima di inviare.';
            if (firstInvalid) {
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => firstInvalid.focus({ preventScroll: true }), 400);
            }
            return;
        }
        openModal();
    });

    function openModal() {
        const summary = $('modalSummary');
        summary.innerHTML = '';
        Object.entries(collect()).forEach(([k, v]) => {
            const row = document.createElement('div');
            const dt  = document.createElement('dt');
            const dd  = document.createElement('dd');
            dt.textContent = k;
            dd.textContent = v;
            row.append(dt, dd);
            summary.append(row);
        });
        modalReview.hidden = false;
        modalResult.hidden = true;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        $('modalConfirm').focus();
    }

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    function showResult(ok, title, text) {
        modalReview.hidden = true;
        modalResult.hidden = false;
        const icon = $('modalResultIcon');
        icon.textContent = ok ? '✓' : '!';
        icon.classList.toggle('is-error', !ok);
        $('modalResultTitle').textContent = title;
        $('modalResultText').textContent  = text;
        $('modalDone').focus();
    }

    // --- Invio email tramite FormSubmit ---
    $('modalConfirm').addEventListener('click', async () => {
        const btn  = $('modalConfirm');
        const data = collect();
        const firstName = form.nome.value.trim();
        // FormSubmit non accetta invii da pagine aperte come file locale (file:///...)
        if (location.protocol === 'file:') {
            showResult(false, 'Apri il sito da un server',
                'Stai aprendo la pagina come file locale (file:///): il servizio email non accetta questi invii. ' +
                'Prova dal sito pubblicato online oppure da un server locale (es. "Live Server" di VS Code).');
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Invio in corso...';
        try {
            const res = await fetch(`https://formsubmit.co/ajax/${ORDER_CONFIG.email}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    _subject:  `Nuovo ordine torta: ${data['Torta']} per ${data['Persone']} persone (${data['Data ritiro']})`,
                    _replyto:  data['Email'],
                    _template: 'table',
                    _captcha:  'false',
                    ...data,
                }),
            });
            const json = await res.json().catch(() => ({}));

            // Primo invio: FormSubmit chiede di attivare il modulo via email
            if (/activat/i.test(json.message || '')) {
                showResult(false, 'Modulo da attivare',
                    `Questo è il primo ordine: FormSubmit ha inviato una mail di attivazione a ${ORDER_CONFIG.email}. ` +
                    'Apri quella mail, clicca su "Activate Form" e poi invia di nuovo l\'ordine.');
                return;
            }
            if (!res.ok || String(json.success) === 'false') throw new Error(json.message || `HTTP ${res.status}`);

            showResult(true, 'Richiesta inviata!',
                `Grazie ${firstName}! Ho ricevuto la tua richiesta: ti contatterò a breve per confermare l'ordine e il prezzo finale.`);
            form.reset();
            form.classList.remove('was-validated');
            people = ORDER_CONFIG.defaultPeople;
            update();
        } catch (err) {
            console.error('Invio ordine fallito:', err);
            showResult(false, 'Invio non riuscito',
                `Si è verificato un problema. Riprova tra poco oppure scrivimi direttamente a ${ORDER_CONFIG.email}.` +
                `\n\nDettaglio: ${err.message || err}`);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Conferma e invia';
        }
    });

    $('modalBack').addEventListener('click', closeModal);
    $('modalClose').addEventListener('click', closeModal);
    $('modalDone').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
    });

    update();
})();
