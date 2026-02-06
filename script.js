// مفتاح API تجريبي - يمكنك استبداله بمفتاحك الخاص لاحقاً
const API_KEY = 'cbc92210ee198f35c4f01e7ff1de635c';
let state = { rates: {}, egp: 0, g24: 0, lang: 'ar' };
let goldChart, currChart;

const currencyData = {
    ar: { 
        'USD': { name: 'دولار أمريكي', flag: '🇺🇸' }, 
        'EUR': { name: 'يورو أوروبي', flag: '🇪🇺' }, 
        'GBP': { name: 'جنيه إسترليني', flag: '🇬🇧' }, 
        'SAR': { name: 'ريال سعودي', flag: '🇸🇦' }, 
        'AED': { name: 'درهم إماراتي', flag: '🇦🇪' }, 
        'KWD': { name: 'دينار كويتي', flag: '🇰🇼' } 
    },
    en: { 
        'USD': { name: 'US Dollar', flag: '🇺🇸' }, 
        'EUR': { name: 'Euro', flag: '🇪🇺' }, 
        'GBP': { name: 'British Pound', flag: '🇬🇧' }, 
        'SAR': { name: 'Saudi Riyal', flag: '🇸🇦' }, 
        'AED': { name: 'UAE Dirham', flag: '🇦🇪' }, 
        'KWD': { name: 'Kuwaiti Dinar', flag: '🇰🇼' } 
    }
};

// 1. دالة جلب أيام الأسبوع للتاريخ
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

// 2. دالة تشغيل الموقع وجلب البيانات
async function init(force = false) {
    const cachedData = localStorage.getItem('omla_data');
    const cachedTime = localStorage.getItem('omla_time');
    
    if (!force && cachedData && (Date.now() - cachedTime < 3600000)) {
        processData(JSON.parse(cachedData));
        return;
    }
    
    try {
        const res = await fetch(`https://api.metalpriceapi.com/v1/latest?api_key=${API_KEY}`);
        const data = await res.json();
        if (data?.success) {
            localStorage.setItem('omla_data', JSON.stringify(data));
            localStorage.setItem('omla_time', Date.now().toString());
            processData(data);
        }
    } catch (e) {
        console.error("خطأ في الاتصال بالـ API");
        if(cachedData) processData(JSON.parse(cachedData));
    }
}

// 3. معالجة البيانات وتخزينها في الحالة (State)
function processData(data) {
    state.rates = data.rates;
    state.egp = data.rates.EGP;
    // حساب سعر جرام الذهب عيار 24 (سعر الأونصة عالمياً / 31.1035 * سعر الدولار المحلي)
    state.g24 = ( (1 / data.rates.XAU) / 31.1035 ) * state.egp;
    
    render();
    renderCharts();
}

// 4. دالة عرض البيانات في الصفحة
function render() {
    const isAr = state.lang === 'ar';
    const list = document.getElementById('currency-list');
    const sel = document.getElementById('c-select');
    if(!list || !sel) return;

    list.innerHTML = ''; sel.innerHTML = '';
    
    Object.keys(currencyData[state.lang]).forEach(c => {
        const val = c === 'USD' ? state.egp : (state.egp / state.rates[c]);
        const meta = currencyData[state.lang][c];
        
        list.innerHTML += `
            <div class="flex justify-between items-center p-4 bg-gray-800/20 rounded-2xl border border-gray-800/40">
                <div class="flex items-center gap-3">
                    <span class="text-xl">${meta.flag}</span>
                    <span class="text-xs font-bold text-gray-300">${meta.name}</span>
                </div>
                <span class="font-mono font-bold text-yellow-500">${val.toFixed(2)}</span>
            </div>`;
            
        sel.innerHTML += `<option value="${c}">${meta.flag} ${meta.name}</option>`;
    });

    // تحديث المحول
    const updateConverter = () => {
        const r = sel.value === 'USD' ? state.egp : (state.egp / state.rates[sel.value]);
        const inputVal = document.getElementById('c-input').value;
        document.getElementById('c-output').innerText = (inputVal * r).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2}) + (isAr ? ' ج.م' : ' EGP');
    };
    sel.onchange = updateConverter; 
    document.getElementById('c-input').oninput = updateConverter; 
    updateConverter();

    // تحديث بطاقات الذهب (مع التقريب لأقرب رقم صحيح)
    document.getElementById('val-g24').innerText = Math.round(state.g24).toLocaleString() + (isAr ? ' ج.م' : ' EGP');
    document.getElementById('val-g21').innerText = Math.round(state.g24 * 0.875).toLocaleString() + (isAr ? ' ج.م' : ' EGP');
    document.getElementById('val-g18').innerText = Math.round(state.g24 * 0.75).toLocaleString() + (isAr ? ' ج.م' : ' EGP');

    // حاسبة المصنعية
    const updateGoldCalc = () => {
        const w = parseFloat(document.getElementById('g-w').value) || 0;
        const m = parseFloat(document.getElementById('g-m').value) || 0;
        const k = document.getElementById('g-k').value;
        let p = state.g24; 
        if(k=="21") p *= 0.875; 
        if(k=="18") p *= 0.75;
        document.getElementById('g-res').innerText = Math.round((p + m) * w).toLocaleString() + (isAr ? ' ج.م' : ' EGP');
    };
    document.getElementById('g-w').oninput = updateGoldCalc;
    document.getElementById('g-k').onchange = updateGoldCalc;
    document.getElementById('g-m').oninput = updateGoldCalc;

    // حاسبة الزكاة
    const updateZakat = () => {
        const weight = parseFloat(document.getElementById('z-w').value) || 0;
        const statusBox = document.getElementById('z-status');
        const resultBox = document.getElementById('z-res');
        const nisab = 85; 
        const goldPrice21 = state.g24 * 0.875;
        
        if (weight >= nisab) {
            const zakatAmount = (weight * goldPrice21) * 0.025;
            statusBox.innerText = isAr ? "بلغ النصاب - تجب عليه الزكاة" : "Nisab reached - Zakat required";
            statusBox.className = "p-4 rounded-xl text-center text-sm font-bold bg-green-500/20 text-green-500 block mb-4";
            resultBox.innerText = Math.round(zakatAmount).toLocaleString() + (isAr ? ' ج.م' : ' EGP');
        } else if (weight > 0) {
            statusBox.innerText = isAr ? "لم يبلغ النصاب (أقل من 85 جرام عيار 21)" : "Nisab not reached";
            statusBox.className = "p-4 rounded-xl text-center text-sm font-bold bg-yellow-500/20 text-yellow-500 block mb-4";
            resultBox.innerText = "0.00";
        } else {
            statusBox.className = "hidden";
            resultBox.innerText = "0.00";
        }
    };
    if(document.getElementById('z-w')) document.getElementById('z-w').oninput = updateZakat;
}

// 5. دالة رسم المخططات البيانية (مع إصلاح تقريب الأرقام)
function renderCharts() {
    if(goldChart) goldChart.destroy(); 
    if(currChart) currChart.destroy();
    
    const days = getDays();

    // مخطط العملة
    currChart = new ApexCharts(document.querySelector("#currencyChart"), {
        chart: { type: 'area', height: 350, toolbar: {show:false}, background:'transparent' },
        series: [{ name: 'EGP', data: [48.15, 48.40, 48.25, 48.65, parseFloat(state.egp.toFixed(2))] }],
        colors: ['#3b82f6'],
        xaxis: { categories: days },
        yaxis: { labels: { formatter: (val) => val.toFixed(2) } },
        theme: { mode: 'dark' },
        stroke: { curve: 'smooth', width: 2 }
    });
    currChart.render();

    // مخطط الذهب
    const g21 = Math.round(state.g24 * 0.875);
    goldChart = new ApexCharts(document.querySelector("#goldMultiChart"), {
        chart: { type: 'line', height: 350, toolbar: {show:false}, background:'transparent' },
        series: [{ name: '21K', data: [g21-20, g21+10, g21-5, g21+15, g21] }],
        colors: ['#ca8a04'],
        xaxis: { categories: days },
        yaxis: { labels: { formatter: (val) => val.toFixed(0) } },
        theme: { mode: 'dark' },
        stroke: { curve: 'stepline', width: 3 }
    });
    goldChart.render();
}

// 6. وظائف التحكم (لغة، تبديل أقسام، تحديث)
function toggleLang() {
    state.lang = state.lang === 'ar' ? 'en' : 'ar';
    document.getElementById('app-html').dir = state.lang === 'ar' ? 'rtl' : 'ltr';
    document.getElementById('lang-toggle-btn').innerText = state.lang === 'ar' ? 'ENGLISH' : 'العربية';
    document.querySelectorAll('[data-ar]').forEach(el => {
        el.innerText = state.lang === 'ar' ? el.getAttribute('data-ar') : el.getAttribute('data-en');
    });
    render();
    renderCharts();
}

function switchTab(t) {
    document.getElementById('section-currency').classList.toggle('hidden-section', t !== 'currency');
    document.getElementById('section-gold').classList.toggle('hidden-section', t !== 'gold');
    document.getElementById('btn-currency').classList.toggle('active', t === 'currency');
    document.getElementById('btn-gold').classList.toggle('active', t === 'gold');
    // إعادة رسم المخططات لتناسب حجم الشاشة الجديد
    window.dispatchEvent(new Event('resize'));
}

function refreshManual() {
    const icon = document.getElementById('refresh-icon');
    icon.classList.add('spinning');
    init(true).then(() => {
        setTimeout(() => icon.classList.remove('spinning'), 1000);
    });
}

// تشغيل عند التحميل

init();
