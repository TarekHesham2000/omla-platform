// مفتاح API
const API_KEY = 'cbc92210ee198f35c4f01e7ff1de635c';
let state = { rates: {}, egp: 0, g24: 0, lang: 'ar', ounce: 0 };
let goldChart, currChart;

const currencyData = {
    ar: { 'USD': { name: 'دولار أمريكي', flag: '🇺🇸' }, 'EUR': { name: 'يورو أوروبي', flag: '🇪🇺' }, 'GBP': { name: 'جنيه إسترليني', flag: '🇬🇧' }, 'SAR': { name: 'ريال سعودي', flag: '🇸🇦' }, 'AED': { name: 'درهم إماراتي', flag: '🇦🇪' }, 'KWD': { name: 'دينار كويتي', flag: '🇰🇼' } },
    en: { 'USD': { name: 'US Dollar', flag: '🇺🇸' }, 'EUR': { name: 'Euro', flag: '🇪🇺' }, 'GBP': { name: 'British Pound', flag: '🇬🇧' }, 'SAR': { name: 'Saudi Riyal', flag: '🇸🇦' }, 'AED': { name: 'UAE Dirham', flag: '🇦🇪' }, 'KWD': { name: 'Kuwaiti Dinar', flag: '🇰🇼' } }
};

function getDays() {
    const arDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const enDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let res = [];
    for (let i = 4; i >= 0; i--) {
        let d = new Date(); d.setDate(d.getDate() - i);
        res.push(state.lang === 'ar' ? arDays[d.getDay()] : enDays[d.getDay()]);
    }
    return res;
}

async function init(force = false) {
    const cachedData = localStorage.getItem('omla_data');
    try {
        const res = await fetch(`https://api.metalpriceapi.com/v1/latest?api_key=${API_KEY}`);
        const data = await res.json();
        if (data && data.success) {
            localStorage.setItem('omla_data', JSON.stringify(data));
            processData(data);
        } else { throw new Error(); }
    } catch (e) {
        const fallback = cachedData ? JSON.parse(cachedData) : {
            rates: { EGP: 48.75, XAU: 0.00039, XAG: 0.032, SAR: 12.98, USD: 1 }
        };
        processData(fallback);
    }
}

function processData(data) {
    state.rates = data.rates;
    state.egp = data.rates.EGP;
    state.ounce = 1 / data.rates.XAU; 
    state.g24 = (state.ounce / 31.1035) * state.egp;
    render();
    renderCharts();
}

function render() {
    const isAr = state.lang === 'ar';
    const list = document.getElementById('currency-list');
    const sel = document.getElementById('c-select');
    if (!list || !sel) return;

    list.innerHTML = ''; sel.innerHTML = '';
    Object.keys(currencyData[state.lang]).forEach(c => {
        const val = c === 'USD' ? state.egp : (state.egp / state.rates[c]);
        const meta = currencyData[state.lang][c];
        list.innerHTML += `<div class="flex justify-between items-center p-4 bg-gray-800/20 rounded-2xl border border-gray-800/40"><div class="flex items-center gap-3"><span class="text-xl">${meta.flag}</span><span class="text-xs font-bold text-gray-300">${meta.name}</span></div><span class="font-mono font-bold text-yellow-500">${val.toFixed(2)}</span></div>`;
        sel.innerHTML += `<option value="${c}">${meta.flag} ${meta.name}</option>`;
    });

    document.getElementById('val-ounce').innerText = `$${Math.round(state.ounce).toLocaleString()}`;
    document.getElementById('val-coin').innerText = Math.round(state.g24 * 0.875 * 8).toLocaleString() + (isAr ? ' ج.م' : ' EGP');
    const silverGramEgp = ((1 / state.rates.XAG) / 31.1035) * state.egp;
    document.getElementById('val-silver').innerText = silverGramEgp.toFixed(2) + (isAr ? ' ج.م' : ' EGP');

    document.getElementById('val-g24').innerText = Math.round(state.g24).toLocaleString() + (isAr ? ' ج.م' : ' EGP');
    document.getElementById('val-g21').innerText = Math.round(state.g24 * 0.875).toLocaleString() + (isAr ? ' ج.م' : ' EGP');
    document.getElementById('val-g18').innerText = Math.round(state.g24 * 0.75).toLocaleString() + (isAr ? ' ج.م' : ' EGP');

    setupCalculators(isAr, sel);
}

function setupCalculators(isAr, sel) {
    const updateC = () => {
        const r = sel.value === 'USD' ? state.egp : (state.egp / state.rates[sel.value]);
        const v = document.getElementById('c-input').value || 0;
        document.getElementById('c-output').innerText = (v * r).toLocaleString(undefined, {minimumFractionDigits:2}) + (isAr ? ' ج.م' : ' EGP');
    };
    sel.onchange = updateC; document.getElementById('c-input').oninput = updateC; updateC();

    const updateG = () => {
        const w = parseFloat(document.getElementById('g-w').value) || 0;
        const m = parseFloat(document.getElementById('g-m').value) || 0;
        const k = document.getElementById('g-k').value;
        let p = state.g24; if(k=="21") p*=0.875; if(k=="18") p*=0.75;
        document.getElementById('g-res').innerText = Math.round((p + m) * w).toLocaleString() + (isAr ? ' ج.م' : ' EGP');
    };
    document.getElementById('g-w').oninput = updateG; document.getElementById('g-k').onchange = updateG; document.getElementById('g-m').oninput = updateG;

    const updateZ = () => {
        const w = parseFloat(document.getElementById('z-w').value) || 0;
        const res = document.getElementById('z-res');
        const st = document.getElementById('z-status');
        if (w >= 85) {
            st.innerText = isAr ? "تجب الزكاة" : "Zakat Required";
            st.className = "p-3 bg-green-500/10 text-green-500 rounded-xl text-xs mb-4 block text-center font-bold";
            res.innerText = Math.round(w * (state.g24 * 0.875) * 0.025).toLocaleString() + (isAr ? ' ج.م' : ' EGP');
        } else {
            st.innerText = isAr ? "لم يبلغ النصاب" : "Below Nisab";
            st.className = "p-3 bg-gray-500/10 text-gray-400 rounded-xl text-xs mb-4 block text-center";
            res.innerText = "0";
        }
    };
    if(document.getElementById('z-w')) document.getElementById('z-w').oninput = updateZ;
}

function renderCharts() {
    if(goldChart) goldChart.destroy(); if(currChart) currChart.destroy();
    const days = getDays();
    const isAr = state.lang === 'ar';

    const commonOptions = {
        chart: { height: 350, toolbar: { show: false }, background: 'transparent', touch: { enabled: true }, zoom: { enabled: false } },
        theme: { mode: 'dark' },
        stroke: { curve: 'smooth', width: 3 },
        xaxis: { categories: days }
    };

    currChart = new ApexCharts(document.querySelector("#currencyChart"), {
        ...commonOptions,
        chart: { ...commonOptions.chart, type: 'area' },
        series: [{ name: 'USD/EGP', data: [48.1, 48.5, 48.3, 48.8, parseFloat(state.egp.toFixed(2))] }],
        colors: ['#3b82f6']
    });
    currChart.render();

    // إرجاع مقارنة الأعيرة الثلاثة (24, 21, 18)
    const p24 = Math.round(state.g24);
    const p21 = Math.round(state.g24 * 0.875);
    const p18 = Math.round(state.g24 * 0.75);

    goldChart = new ApexCharts(document.querySelector("#goldMultiChart"), {
        ...commonOptions,
        chart: { ...commonOptions.chart, type: 'line' },
        series: [
            { name: isAr ? 'عيار 24' : '24K', data: [p24-15, p24+5, p24-10, p24+10, p24] },
            { name: isAr ? 'عيار 21' : '21K', data: [p21-15, p21+5, p21-10, p21+10, p21] },
            { name: isAr ? 'عيار 18' : '18K', data: [p18-15, p18+5, p18-10, p18+10, p18] }
        ],
        colors: ['#facc15', '#fb923c', '#94a3b8'],
        stroke: {
            width: [3, 3, 3],
            curve: 'smooth',
            dashArray: [0, 5, 8] // متصل لـ 24، منقط لـ 21، منقط جداً لـ 18
        },
        legend: { show: true, position: 'top' }
    });
    goldChart.render();
}

function switchTab(t) {
    document.getElementById('section-currency').classList.toggle('hidden-section', t !== 'currency');
    document.getElementById('section-gold').classList.toggle('hidden-section', t !== 'gold');
    document.getElementById('btn-currency').classList.toggle('active', t === 'currency');
    document.getElementById('btn-gold').classList.toggle('active', t === 'gold');
    setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 100);
}

function toggleLang() {
    state.lang = state.lang === 'ar' ? 'en' : 'ar';
    document.getElementById('app-html').dir = state.lang === 'ar' ? 'rtl' : 'ltr';
    document.getElementById('lang-toggle-btn').innerText = state.lang === 'ar' ? 'ENGLISH' : 'العربية';
    document.querySelectorAll('[data-ar]').forEach(el => el.innerText = state.lang === 'ar' ? el.getAttribute('data-ar') : el.getAttribute('data-en'));
    render(); renderCharts();
}

function refreshManual() {
    document.getElementById('refresh-icon').classList.add('spinning');
    init(true).then(() => setTimeout(() => document.getElementById('refresh-icon').classList.remove('spinning'), 1000));
}

init();